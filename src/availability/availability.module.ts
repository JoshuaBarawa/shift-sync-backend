import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Availability } from './availability.entity';
import { AvailabilityException } from './availability-exception.entity';
import { User } from '../users/entities/user.entity'; 
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [SequelizeModule.forFeature([Availability, AvailabilityException, User]),
  AuthModule
],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService], // exported so shifts module can use it
})
export class AvailabilityModule {}