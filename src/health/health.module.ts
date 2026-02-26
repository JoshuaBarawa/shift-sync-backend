import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [HealthController],
})
export class HealthModule {}