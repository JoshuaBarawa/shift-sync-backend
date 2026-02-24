import { IsEnum, IsArray, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Role, Skill } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsArray()
  @IsEnum(Skill, { each: true })
  @IsOptional()
  skills?: Skill[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}