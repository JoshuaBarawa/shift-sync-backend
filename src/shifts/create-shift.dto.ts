// create-shift.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { RequiredSkill } from './shift.entity';

export class CreateShiftDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  locationId: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;

  @ApiProperty({ enum: RequiredSkill, example: RequiredSkill.SERVER })
  @IsEnum(RequiredSkill)
  requiredSkill: RequiredSkill;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @Min(1)
  @IsOptional()
  headcount?: number;

  @ApiPropertyOptional({ example: 'Please arrive 10 minutes early' })
  @IsString()
  @IsOptional()
  notes?: string;
}