// shifts.module.ts
import { Module, forwardRef } from '@nestjs/common';
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
import { SwapsModule } from '../swaps/swaps.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module'; 
@Module({
  imports: [
    SequelizeModule.forFeature([Shift, ShiftAssignment, User, Location, UserLocation]),
    AvailabilityModule,
    AuthModule,
    NotificationsModule,
    AuditModule,
    forwardRef(() => SwapsModule),
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}