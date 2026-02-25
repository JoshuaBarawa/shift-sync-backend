// assign-staff.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AssignStaffDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;
}