// reject.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectDto {
  @ApiPropertyOptional({ example: 'Not enough coverage that day' })
  @IsString()
  @IsOptional()
  reason?: string;
}