// create-availability-exception.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class CreateAvailabilityExceptionDto {
  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:MM format' })
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:MM format' })
  endTime?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isAvailable: boolean;

  @ApiPropertyOptional({ example: 'Doctor appointment' })
  @IsString()
  @IsOptional()
  reason?: string;
}