
import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SwapRequest } from './entities/swap-request.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { SwapsService } from './swaps.service';
import { SwapsController } from './swaps.controller';
import { AuthModule } from '../auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { ShiftsModule } from '../shifts/shifts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module'; 
@Module({
  imports: [
    SequelizeModule.forFeature([SwapRequest, Shift, ShiftAssignment, User]),
    AuthModule,
    NotificationsModule,
    AuditModule,
    forwardRef(() => ShiftsModule),
  ],
  controllers: [SwapsController],
  providers: [SwapsService],
  exports: [SwapsService],
})
export class SwapsModule {}