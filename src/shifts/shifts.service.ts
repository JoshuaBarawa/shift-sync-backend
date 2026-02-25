// shifts.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Shift, ShiftStatus } from './entities/shift.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { User } from '../users/entities/user.entity';
import { Location } from '../locations/entities/location.entity';
import { UserLocation } from '../users/entities/user-location.entity';
import { AvailabilityService } from '../availability/availability.service';
import { CreateShiftDto } from './dtos/create-shift.dto';
import { AssignStaffDto } from './dtos/assign-staff.dto';

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
  ) {}

  // --- Shifts CRUD ---

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
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const shift = await this.findOne(id);
    await shift.update({ status: ShiftStatus.CANCELLED });
  }

  async publish(id: number): Promise<Shift> {
    const shift = await this.findOne(id);
    await shift.update({ status: ShiftStatus.PUBLISHED });
    return this.findOne(id);
  }

  async unpublish(id: number): Promise<Shift> {
    const shift = await this.findOne(id);
    await shift.update({ status: ShiftStatus.DRAFT });
    return this.findOne(id);
  }

  // --- Assignments ---

  async assignStaff(shiftId: number, dto: AssignStaffDto): Promise<{ success: boolean; message: string; assignment?: ShiftAssignment }> {
    const shift = await this.findOne(shiftId);
    const user = await this.userModel.findOne({ where: { id: dto.userId, isActive: true } });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    // 1. Check location certification
    const isCertified = await this.userLocationModel.findOne({
      where: { userId: dto.userId, locationId: shift.locationId },
    });
    if (!isCertified) {
      return {
        success: false,
        message: `${user.name} is not certified to work at this location`,
      };
    }

    // 2. Check skill match
    if (!user.skills?.includes(shift.requiredSkill as any)) {
      return {
        success: false,
        message: `${user.name} does not have the required skill: ${shift.requiredSkill}. Their skills: ${user.skills?.join(', ') || 'none'}`,
      };
    }

    // 3. Check availability
    const availability = await this.availabilityService.isUserAvailable(
      dto.userId,
      shift.date,
      shift.startTime,
      shift.endTime,
    );
    if (!availability.available) {
      return { success: false, message: availability.reason ?? 'Staff is not available' };
    }

    // 4. Check double booking
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

    // 5. Check 10-hour rest rule
    const restViolation = await this.checkRestPeriod(dto.userId, shift.date, shift.startTime, shift.endTime, shiftId);
    if (restViolation) {
      return { success: false, message: restViolation };
    }

    // 6. Check headcount
    const currentAssignments = await this.assignmentModel.count({ where: { shiftId } });
    if (currentAssignments >= shift.headcount) {
      return { success: false, message: `Shift is already fully staffed (${shift.headcount} needed)` };
    }

    // 7. Check not already assigned
    const alreadyAssigned = await this.assignmentModel.findOne({ where: { shiftId, userId: dto.userId } });
    if (alreadyAssigned) {
      return { success: false, message: `${user.name} is already assigned to this shift` };
    }

    const assignment = await this.assignmentModel.create({ shiftId, userId: dto.userId } as any);
    return { success: true, message: `${user.name} successfully assigned to shift`, assignment };
  }

  async unassignStaff(shiftId: number, userId: number): Promise<void> {
    const assignment = await this.assignmentModel.findOne({ where: { shiftId, userId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await assignment.destroy();
  }

  // --- Find qualified replacements for a shift (for Sunday Night Chaos scenario) ---

  async findQualifiedStaff(shiftId: number): Promise<{ available: User[]; unavailable: { user: User; reason: string }[] }> {
    const shift = await this.findOne(shiftId);

    // get all users certified at this location with the required skill
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
      // skip already assigned
      const assigned = await this.assignmentModel.findOne({ where: { shiftId, userId: user.id } });
      if (assigned) continue;

      const avail = await this.availabilityService.isUserAvailable(user.id, shift.date, shift.startTime, shift.endTime);
      const doubleBooked = await this.assignmentModel.findOne({
        include: [{ model: Shift, where: { date: shift.date, id: { [Op.ne]: shiftId }, status: { [Op.ne]: ShiftStatus.CANCELLED } } }],
        where: { userId: user.id },
      });

      if (avail.available && !doubleBooked) {
        available.push(user);
      } else {
        unavailable.push({ user, reason: doubleBooked ? 'Already assigned to another shift' : avail.reason ?? 'Unavailable' });
      }
    }

    return { available, unavailable };
  }

  // --- Helpers ---

  private checkIfPremium(date: string, startTime: string): boolean {
    const day = new Date(date).getDay();
    const hour = parseInt(startTime.split(':')[0]);
    return (day === 5 || day === 6) && hour >= 17;
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
          date: { [Op.between]: [dayBefore.toISOString().split('T')[0], dayAfter.toISOString().split('T')[0]] },
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

  private toMinutes(date: string, time: string): number {
    const [hours, mins] = time.split(':').map(Number);
    const dayOffset = new Date(date).getDate() * 24 * 60;
    return dayOffset + hours * 60 + mins;
  }
}