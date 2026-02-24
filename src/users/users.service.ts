import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.userModel.create({ ...dto, password: hashed } as any);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll({ where: { isActive: true } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userModel.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    return user.update(dto);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await user.update({ isActive: false });
  }
}