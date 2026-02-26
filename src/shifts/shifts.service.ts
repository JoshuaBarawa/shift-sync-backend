// shifts.service.ts
import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Shift, ShiftStatus } from './entities/shift.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { User } from '../users/entities/user.entity';
import { Location } from '../locations/entities/location.entity';
import { UserLocation } from '../users/entities/user-location.entity';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SwapsService } from '../swaps/swaps.service';
import { CreateShiftDto } from './dtos/create-shift.dto';
import { AssignStaffDto } from './dtos/assign-staff.dto';

const OVERTIME_WARNING_HOURS = 35;
const OVERTIME_BLOCK_HOURS = 40;
const DAILY_BLOCK_HOURS = 12;

@Injectable()
export class ShiftsService {
  constructor(
    @InjectModel(Shift)
    private readonly shiftModel: typeof Shift,

    @InjectModel(ShiftAssignment)
    private readonly assignmentModel: typeof ShiftAssignment,

    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,

    private readonly availabilityService: AvailabilityService,
    private readonly notificationsService: NotificationsService,

    @Inject(forwardRef(() => SwapsService))
    private readonly swapsService: SwapsService,
  ) {}

  // -----------------------------------------------
  // SHIFTS CRUD
  // -----------------------------------------------

  async create(dto: CreateShiftDto): Promise<Shift> {
    const isPremium = this.checkIfPremium(dto.date, dto.startTime);
    const shift = await this.shiftModel.create({ ...dto, isPremium } as any);
    return this.findOne(shift.id);
  }

  async findAll(locationId?: number): Promise<Shift[]> {
    const where: any = {};
    if (locationId) where.locationId = locationId;
    return this.shiftModel.findAll({
      where,
      include: [Location, { model: ShiftAssignment, include: [User] }],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });
  }

  async findOne(id: number): Promise<Shift> {
    const shift = await this.shiftModel.findOne({
      where: { id },
      include: [Location, { model: ShiftAssignment, include: [User] }],
    });
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);
    return shift;
  }

  async update(id: number, dto: Partial<CreateShiftDto>): Promise<Shift> {
    const shift = await this.findOne(id);
    if (shift.status === ShiftStatus.PUBLISHED) {
      throw new BadRequestException('Cannot edit a published shift. Unpublish it first.');
    }
    await shift.update(dto);

    // Notify all assigned staff that the shift was edited
    const assignments = await this.assignmentModel.findAll({ where: { shiftId: id } });
    const assignedUserIds = assignments.map((a) => a.userId);
    if (assignedUserIds.length > 0) {
      await this.notificationsService.notifyShiftEdited(
        assignedUserIds,
        id,
        shift.location?.name ?? 'your location',
        shift.date,
      );
    }

    // Auto-cancel any pending swap requests for this shift
    await this.swapsService.cancelPendingSwapsForShift(id);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const shift = await this.findOne(id);

    // Notify assigned staff
    const assignments = await this.assignmentModel.findAll({ where: { shiftId: id } });
    const assignedUserIds = assignments.map((a) => a.userId);
    if (assignedUserIds.length > 0) {
      await this.notificationsService.notifyShiftCancelled(
        assignedUserIds,
        id,
        shift.location?.name ?? 'your location',
        shift.date,
      );
    }

    await shift.update({ status: ShiftStatus.CANCELLED });
  }

  async publish(id: number): Promise<Shift> {
    const shift = await this.findOne(id);
    await shift.update({ status: ShiftStatus.PUBLISHED });

    // Notify all assigned staff
    const assignments = await this.assignmentModel.findAll({ where: { shiftId: id } });
    const assignedUserIds = assignments.map((a) => a.userId);
    if (assignedUserIds.length > 0) {
      await this.notificationsService.notifyShiftPublished(
        assignedUserIds,
        id,
        shift.location?.name ?? 'your location',
        shift.date,
      );
    }

    return this.findOne(id);
  }

  async unpublish(id: number): Promise<Shift> {
    const shift = await this.findOne(id);
    await shift.update({ status: ShiftStatus.DRAFT });
    return this.findOne(id);
  }

  // -----------------------------------------------
  // ASSIGN STAFF
  // -----------------------------------------------

  async assignStaff(shiftId: number, dto: AssignStaffDto): Promise<{
    success: boolean;
    message: string;
    warning?: string;
    assignment?: ShiftAssignment;
  }> {
    const shift = await this.findOne(shiftId);
    const user = await this.userModel.findOne({ where: { id: dto.userId, isActive: true } });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    // 1. Location certification
    const isCertified = await this.userLocationModel.findOne({
      where: { userId: dto.userId, locationId: shift.locationId },
    });
    if (!isCertified) {
      return { success: false, message: `${user.name} is not certified to work at this location` };
    }

    // 2. Skill match
    if (!user.skills?.includes(shift.requiredSkill as any)) {
      return {
        success: false,
        message: `${user.name} does not have the required skill: ${shift.requiredSkill}. Their skills: ${user.skills?.join(', ') || 'none'}`,
      };
    }

    // 3. Availability
    const availability = await this.availabilityService.isUserAvailable(
      dto.userId, shift.date, shift.startTime, shift.endTime,
    );
    if (!availability.available) {
      return { success: false, message: availability.reason ?? 'Staff is not available' };
    }

    // 4. Double booking
    const overlapping = await this.assignmentModel.findOne({
      include: [{
        model: Shift,
        where: {
          date: shift.date,
          id: { [Op.ne]: shiftId },
          status: { [Op.ne]: ShiftStatus.CANCELLED },
        },
      }],
      where: { userId: dto.userId },
    });
    if (overlapping) {
      return { success: false, message: `${user.name} is already assigned to another shift on this date` };
    }

    // 5. 10-hour rest rule
    const restViolation = await this.checkRestPeriod(dto.userId, shift.date, shift.startTime, shift.endTime, shiftId);
    if (restViolation) {
      return { success: false, message: restViolation };
    }

    // 6. Headcount
    const currentAssignments = await this.assignmentModel.count({ where: { shiftId } });
    if (currentAssignments >= shift.headcount) {
      return { success: false, message: `Shift is already fully staffed (${shift.headcount} needed)` };
    }

    // 7. Already assigned
    const alreadyAssigned = await this.assignmentModel.findOne({ where: { shiftId, userId: dto.userId } });
    if (alreadyAssigned) {
      return { success: false, message: `${user.name} is already assigned to this shift` };
    }

    // 8. Daily hours
    const shiftHours = this.calcHours(shift.startTime, shift.endTime);
    if (shiftHours > DAILY_BLOCK_HOURS) {
      return {
        success: false,
        message: `This shift is ${shiftHours} hours long which exceeds the maximum ${DAILY_BLOCK_HOURS} hours per day`,
      };
    }

    // 9. Weekly overtime check
    const overtimeResult = await this.checkWeeklyHours(dto.userId, shift.date, shiftHours, user.name);
    if (overtimeResult.block) {
      return { success: false, message: overtimeResult.message };
    }

    // All checks passed — create assignment
    const assignment = await this.assignmentModel.create({ shiftId, userId: dto.userId } as any);

    // Notify the staff member
    await this.notificationsService.notifyShiftAssigned(
      dto.userId,
      shiftId,
      shift.location?.name ?? 'your location',
      shift.date,
      shift.startTime,
      shift.endTime,
    );

    return {
      success: true,
      message: `${user.name} successfully assigned to shift`,
      warning: overtimeResult.warning ? overtimeResult.message : undefined,
      assignment,
    };
  }

  async unassignStaff(shiftId: number, userId: number): Promise<void> {
    const shift = await this.findOne(shiftId);
    const assignment = await this.assignmentModel.findOne({ where: { shiftId, userId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await assignment.destroy();

    // Notify the staff member
    await this.notificationsService.notifyShiftUnassigned(
      userId,
      shiftId,
      shift.location?.name ?? 'your location',
      shift.date,
    );
  }

  // -----------------------------------------------
  // WEEKLY HOURS SUMMARY
  // -----------------------------------------------

  async getWeeklyHours(userId: number, weekStartDate: string): Promise<{
    userId: number;
    weekStart: string;
    weekEnd: string;
    totalHours: number;
    shifts: { date: string; startTime: string; endTime: string; hours: number; locationName: string }[];
    status: 'safe' | 'warning' | 'overtime';
  }> {
    const weekStart = new Date(weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const assignments = await this.assignmentModel.findAll({
      where: { userId },
      include: [{
        model: Shift,
        where: {
          date: {
            [Op.between]: [
              weekStart.toISOString().split('T')[0],
              weekEnd.toISOString().split('T')[0],
            ],
          },
          status: { [Op.ne]: ShiftStatus.CANCELLED },
        },
        include: [Location],
      }],
    });

    const shifts = assignments.map((a) => {
      const s = a.shift;
      return {
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        hours: this.calcHours(s.startTime, s.endTime),
        locationName: s.location?.name ?? 'Unknown',
      };
    });

    const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);
    let status: 'safe' | 'warning' | 'overtime' = 'safe';
    if (totalHours >= OVERTIME_BLOCK_HOURS) status = 'overtime';
    else if (totalHours >= OVERTIME_WARNING_HOURS) status = 'warning';

    return {
      userId,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalHours,
      shifts,
      status,
    };
  }

  // -----------------------------------------------
  // QUALIFIED STAFF FINDER
  // -----------------------------------------------

  async findQualifiedStaff(shiftId: number): Promise<{
    available: User[];
    unavailable: { user: User; reason: string }[];
  }> {
    const shift = await this.findOne(shiftId);

    const certifiedUsers = await this.userModel.findAll({
      include: [{
        model: Location,
        where: { id: shift.locationId },
        through: { attributes: [] },
      }],
      where: { isActive: true },
    });

    const qualified = certifiedUsers.filter(u => u.skills?.includes(shift.requiredSkill as any));
    const available: User[] = [];
    const unavailable: { user: User; reason: string }[] = [];

    for (const user of qualified) {
      const assigned = await this.assignmentModel.findOne({ where: { shiftId, userId: user.id } });
      if (assigned) continue;

      const avail = await this.availabilityService.isUserAvailable(user.id, shift.date, shift.startTime, shift.endTime);
      const doubleBooked = await this.assignmentModel.findOne({
        include: [{
          model: Shift,
          where: {
            date: shift.date,
            id: { [Op.ne]: shiftId },
            status: { [Op.ne]: ShiftStatus.CANCELLED },
          },
        }],
        where: { userId: user.id },
      });

      if (avail.available && !doubleBooked) {
        available.push(user);
      } else {
        unavailable.push({
          user,
          reason: doubleBooked ? 'Already assigned to another shift' : avail.reason ?? 'Unavailable',
        });
      }
    }

    return { available, unavailable };
  }

  // -----------------------------------------------
  // HELPERS
  // -----------------------------------------------

  private async checkWeeklyHours(userId: number, date: string, newShiftHours: number, userName?: string): Promise<{
    block: boolean;
    warning: boolean;
    message: string;
  }> {
    const d = new Date(date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const assignments = await this.assignmentModel.findAll({
      where: { userId },
      include: [{
        model: Shift,
        where: {
          date: {
            [Op.between]: [
              monday.toISOString().split('T')[0],
              sunday.toISOString().split('T')[0],
            ],
          },
          status: { [Op.ne]: ShiftStatus.CANCELLED },
        },
      }],
    });

    const existingHours = assignments.reduce((sum, a) => sum + this.calcHours(a.shift.startTime, a.shift.endTime), 0);
    const projectedHours = existingHours + newShiftHours;

    if (projectedHours > OVERTIME_BLOCK_HOURS) {
      return {
        block: true,
        warning: false,
        message: `This assignment would put ${this.formatHours(projectedHours)} on the schedule this week, exceeding the ${OVERTIME_BLOCK_HOURS}hr limit. Current hours: ${this.formatHours(existingHours)}`,
      };
    }

    if (projectedHours >= OVERTIME_WARNING_HOURS) {
      return {
        block: false,
        warning: true,
        message: `⚠️ Warning: This assignment brings ${userName ?? 'this staff member'} to ${this.formatHours(projectedHours)} this week (overtime threshold: ${OVERTIME_BLOCK_HOURS}hrs)`,
      };
    }

    return { block: false, warning: false, message: '' };
  }

  private async checkRestPeriod(userId: number, date: string, startTime: string, endTime: string, excludeShiftId: number): Promise<string | null> {
    const dateObj = new Date(date);
    const dayBefore = new Date(dateObj);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(dateObj);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const nearbyAssignments = await this.assignmentModel.findAll({
      where: { userId },
      include: [{
        model: Shift,
        where: {
          id: { [Op.ne]: excludeShiftId },
          status: { [Op.ne]: ShiftStatus.CANCELLED },
          date: {
            [Op.between]: [
              dayBefore.toISOString().split('T')[0],
              dayAfter.toISOString().split('T')[0],
            ],
          },
        },
      }],
    });

    const newStart = this.toMinutes(date, startTime);
    const newEnd = this.toMinutes(date, endTime);

    for (const assignment of nearbyAssignments) {
      const s = assignment.shift;
      const existingStart = this.toMinutes(s.date, s.startTime);
      const existingEnd = this.toMinutes(s.date, s.endTime);
      const restAfterExisting = newStart - existingEnd;
      const restAfterNew = existingStart - newEnd;

      if (restAfterExisting >= 0 && restAfterExisting < 600) {
        return `Less than 10 hours rest between shifts (only ${Math.floor(restAfterExisting / 60)}h ${restAfterExisting % 60}m gap)`;
      }
      if (restAfterNew >= 0 && restAfterNew < 600) {
        return `Less than 10 hours rest between shifts (only ${Math.floor(restAfterNew / 60)}h ${restAfterNew % 60}m gap)`;
      }
    }

    return null;
  }

  private checkIfPremium(date: string, startTime: string): boolean {
    const day = new Date(date).getDay();
    const hour = parseInt(startTime.split(':')[0]);
    return (day === 5 || day === 6) && hour >= 17;
  }

  private calcHours(startTime: string, endTime: string): number {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins >= startMins ? endMins - startMins : (24 * 60 - startMins) + endMins;
    return diff / 60;
  }

  private formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  private toMinutes(date: string, time: string): number {
    const [hours, mins] = time.split(':').map(Number);
    const dayOffset = new Date(date).getDate() * 24 * 60;
    return dayOffset + hours * 60 + mins;
  }
}