import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Location } from './location.entity';
import { CreateLocationDto } from './create-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location)
    private readonly locationModel: typeof Location,
  ) {}

  async create(dto: CreateLocationDto): Promise<Location> {
    return this.locationModel.create({ ...dto } as any);
  }

  async findAll(): Promise<Location[]> {
    return this.locationModel.findAll({ where: { isActive: true } });
  }

  async findOne(id: number): Promise<Location> {
    const location = await this.locationModel.findOne({ where: { id } });
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
}