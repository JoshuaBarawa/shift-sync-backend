
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { DayOfWeek } from '../entities/availability.entity';

export class CreateAvailabilityDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}