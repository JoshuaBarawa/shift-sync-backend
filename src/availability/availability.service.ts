import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Availability } from './entities/availability.entity';
import { AvailabilityException } from './entities/availability-exception.entity';
import { CreateAvailabilityDto } from './dtos/create-availability.dto';
import { CreateAvailabilityExceptionDto } from './dtos/create-availability-exception.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Availability)
    private readonly availabilityModel: typeof Availability,

    @InjectModel(AvailabilityException)
    private readonly exceptionModel: typeof AvailabilityException,
  ) {}

  // --- Recurring Availability ---

  async setAvailability(userId: number, dto: CreateAvailabilityDto): Promise<Availability> {
    // If a record already exists for this user + day, update it
    const existing = await this.availabilityModel.findOne({
      where: { userId, dayOfWeek: dto.dayOfWeek },
    });

    if (existing) {
      return existing.update({ ...dto });
    }

    return this.availabilityModel.create({ userId, ...dto } as any);
  }

  async getUserAvailability(userId: number): Promise<Availability[]> {
    return this.availabilityModel.findAll({
      where: { userId },
      order: [['dayOfWeek', 'ASC']],
    });
  }

  async deleteAvailability(id: number, userId: number): Promise<void> {
    const record = await this.availabilityModel.findOne({ where: { id, userId } });
    if (!record) throw new NotFoundException(`Availability ${id} not found`);
    await record.destroy();
  }

  // --- Exceptions ---

  async addException(userId: number, dto: CreateAvailabilityExceptionDto): Promise<AvailabilityException> {
    // If exception already exists for this user + date, update it
    const existing = await this.exceptionModel.findOne({
      where: { userId, date: dto.date },
    });

    if (existing) {
      return existing.update({ ...dto });
    }

    return this.exceptionModel.create({ userId, ...dto } as any);
  }

  async getUserExceptions(userId: number): Promise<AvailabilityException[]> {
    return this.exceptionModel.findAll({
      where: { userId },
      order: [['date', 'ASC']],
    });
  }

  async deleteException(id: number, userId: number): Promise<void> {
    const record = await this.exceptionModel.findOne({ where: { id, userId } });
    if (!record) throw new NotFoundException(`Exception ${id} not found`);
    await record.destroy();
  }

  // --- Used by constraint engine in shifts ---

  async isUserAvailable(userId: number, date: string, startTime: string, endTime: string): Promise<{ available: boolean; reason?: string }> {
    // 1. Check exceptions first — they override everything
    const exception = await this.exceptionModel.findOne({
      where: { userId, date },
    });

    if (exception) {
      if (!exception.isAvailable) {
        return { available: false, reason: exception.reason ?? 'Staff marked unavailable for this date' };
      }
      // Available with specific hours
      if (exception.startTime && exception.endTime) {
        const covers = exception.startTime <= startTime && exception.endTime >= endTime;
        if (!covers) {
          return { available: false, reason: `Staff is only available ${exception.startTime}–${exception.endTime} on this date` };
        }
      }
      return { available: true };
    }

    // 2. Fall back to recurring availability for that day of week
    const dayOfWeek = new Date(date).getDay();
    const recurring = await this.availabilityModel.findOne({
      where: { userId, dayOfWeek },
    });

    if (!recurring || !recurring.isAvailable) {
      return { available: false, reason: 'Staff is not available on this day of the week' };
    }

    const covers = recurring.startTime <= startTime && recurring.endTime >= endTime;
    if (!covers) {
      return { available: false, reason: `Staff is only available ${recurring.startTime}–${recurring.endTime} on this day` };
    }

    return { available: true };
  }
}