import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Location } from './entities/location.entity';
import { UserLocation } from '../users/entities/user-location.entity';
import { User } from '../users/entities/user.entity';
import { CreateLocationDto } from './dtos/create-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location)
    private readonly locationModel: typeof Location,

    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,

    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(dto: CreateLocationDto): Promise<Location> {
    return this.locationModel.create({ ...dto } as any);
  }

  async findAll(): Promise<Location[]> {
    return this.locationModel.findAll({ where: { isActive: true } });
  }

  async findOne(id: number): Promise<Location> {
    const location = await this.locationModel.findOne({
      where: { id },
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role', 'skills'] }],
    });
    if (!location) throw new NotFoundException(`Location ${id} not found`);
    return location;
  }

  async update(id: number, dto: Partial<CreateLocationDto>): Promise<Location> {
    const location = await this.findOne(id);
    return location.update(dto);
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    await location.update({ isActive: false });
  }

  // --- Certifications ---

  async certifyUser(locationId: number, userId: number): Promise<{ message: string }> {
    const location = await this.locationModel.findOne({ where: { id: locationId } });
    if (!location) throw new NotFoundException(`Location ${locationId} not found`);

    const user = await this.userModel.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const existing = await this.userLocationModel.findOne({ where: { locationId, userId } });
    if (existing) throw new ConflictException(`User ${user.name} is already certified at this location`);

    await this.userLocationModel.create({ locationId, userId } as any);
    return { message: `${user.name} is now certified at ${location.name}` };
  }

  async decertifyUser(locationId: number, userId: number): Promise<{ message: string }> {
    const record = await this.userLocationModel.findOne({ where: { locationId, userId } });
    if (!record) throw new NotFoundException('Certification not found');

    await record.destroy();
    return { message: 'Certification removed' };
  }

  async getCertifiedUsers(locationId: number): Promise<User[]> {
    const location = await this.locationModel.findOne({
      where: { id: locationId },
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role', 'skills'] }],
    });
    if (!location) throw new NotFoundException(`Location ${locationId} not found`);
    return location.certifiedUsers ?? [];
  }

  async isUserCertified(locationId: number, userId: number): Promise<boolean> {
    const record = await this.userLocationModel.findOne({ where: { locationId, userId } });
    return !!record;
  }
}