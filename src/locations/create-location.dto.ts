import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsTimeZone } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Downtown Branch' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main St, New York, NY' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'America/New_York' })
  @IsTimeZone()
  timezone: string;
}