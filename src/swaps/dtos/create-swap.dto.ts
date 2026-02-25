// create-swap.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { SwapType } from '../entities/swap-request.entity';

export class CreateSwapDto {
  @ApiProperty({ enum: SwapType, example: SwapType.SWAP })
  @IsEnum(SwapType)
  type: SwapType;

  @ApiProperty({ example: 1, description: 'Shift Staff A wants to give up' })
  @IsInt()
  requesterShiftId: number;

  @ApiPropertyOptional({ example: 2, description: 'Staff B user ID (swap only)' })
  @IsInt()
  @IsOptional()
  requesteeId?: number;

  @ApiPropertyOptional({ example: 3, description: 'Shift Staff B would give in return (swap only)' })
  @IsInt()
  @IsOptional()
  requesteeShiftId?: number;

  @ApiPropertyOptional({ example: 'I have a family event' })
  @IsString()
  @IsOptional()
  reason?: string;
}