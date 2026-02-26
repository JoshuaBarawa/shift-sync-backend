
import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
import { Location } from '../locations/entities/location.entity';
import { UserLocation } from '../users/entities/user-location.entity';
import { Availability } from '../availability/entities/availability.entity';
import { AvailabilityException } from '../availability/entities/availability-exception.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { SwapRequest } from '../swaps/entities/swap-request.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';



export const databaseConfig = (config: ConfigService): SequelizeModuleOptions => ({
  dialect: 'mysql',
  host: config.getOrThrow<string>('DB_HOST'),
  port: config.getOrThrow<number>('DB_PORT'),
  username: config.getOrThrow<string>('DB_USERNAME'),
  password: config.getOrThrow<string>('DB_PASSWORD'),
  database: config.getOrThrow<string>('DB_NAME'),
  models: [User, Location, UserLocation, Availability, AvailabilityException, Shift, ShiftAssignment, SwapRequest, Notification, AuditLog],
  autoLoadModels: true,
  synchronize: true,
  logging: false,
});