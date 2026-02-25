import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsTimeZone } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Coastal Eats Nairobi' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Westlands, Nairobi, Kenya' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Africa/Nairobi' })
  @IsTimeZone()
  timezone: string;
}