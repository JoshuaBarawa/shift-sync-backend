// database.config.ts
import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
import { Location } from '../locations/location.entity';
import { UserLocation } from '../users/entities/user-location.entity';
import { Availability } from '../availability/availability.entity';
import { AvailabilityException } from '../availability/availability-exception.entity';
import { Shift } from '../shifts/shift.entity';
import { ShiftAssignment } from '../shifts/shift-assignment.entity';
import { SwapRequest } from '../swaps/swap-request.entity';

export const databaseConfig = (config: ConfigService): SequelizeModuleOptions => ({
  dialect: 'mysql',
  host: config.getOrThrow<string>('DB_HOST'),
  port: config.getOrThrow<number>('DB_PORT'),
  username: config.getOrThrow<string>('DB_USERNAME'),
  password: config.getOrThrow<string>('DB_PASSWORD'),
  database: config.getOrThrow<string>('DB_NAME'),
  models: [User, Location, UserLocation, Availability, AvailabilityException, Shift, ShiftAssignment, SwapRequest],
  autoLoadModels: true,
  synchronize: true,
  logging: false,
});