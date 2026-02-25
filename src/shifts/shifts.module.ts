// shifts.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Shift } from './entities/shift.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { User } from '../users/entities/user.entity';
import { Location } from '../locations/entities/location.entity';
import { UserLocation } from '../users/entities/user-location.entity';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { AvailabilityModule } from '../availability/availability.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Shift, ShiftAssignment, User, Location, UserLocation]),
    AvailabilityModule,
    AuthModule,
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}