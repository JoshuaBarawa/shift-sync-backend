import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsArray, IsOptional, IsString, MinLength } from 'class-validator';
import { Role, Skill } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Role, example: Role.STAFF })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ enum: Skill, isArray: true, example: [Skill.SERVER] })
  @IsArray()
  @IsEnum(Skill, { each: true })
  @IsOptional()
  skills?: Skill[];
}