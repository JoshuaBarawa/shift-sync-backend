// locations.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Location } from './location.entity';
import { UserLocation } from '../users/entities/user-location.entity';
import { User } from '../users/entities/user.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';

@Module({
  imports: [SequelizeModule.forFeature([Location, UserLocation, User])],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}