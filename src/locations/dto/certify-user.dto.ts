import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CertifyUserDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;
}