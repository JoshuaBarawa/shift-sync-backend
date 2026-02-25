// availability.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Availability } from './availability.entity';
import { AvailabilityException } from './availability-exception.entity';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';

@Module({
  imports: [SequelizeModule.forFeature([Availability, AvailabilityException])],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService], // exported so shifts module can use it
})
export class AvailabilityModule {}