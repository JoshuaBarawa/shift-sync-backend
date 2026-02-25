// swaps.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SwapRequest } from './entities/swap-request.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { SwapsService } from './swaps.service';
import { SwapsController } from './swaps.controller';
import { AuthModule } from '../auth/auth.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([SwapRequest, Shift, ShiftAssignment, User]),
    AuthModule,
  ],
  controllers: [SwapsController],
  providers: [SwapsService],
  exports: [SwapsService],
})
export class SwapsModule {}