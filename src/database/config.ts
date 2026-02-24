import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
import { Location } from '../locations/location.entity';

export const databaseConfig = (config: ConfigService): SequelizeModuleOptions => ({
  dialect: 'mysql',
  host: config.getOrThrow<string>('DB_HOST'),
  port: config.getOrThrow<number>('DB_PORT'),
  username: config.getOrThrow<string>('DB_USERNAME'),
  password: config.getOrThrow<string>('DB_PASSWORD'),
  database: config.getOrThrow<string>('DB_NAME'),
  models: [User, Location],
  autoLoadModels: true,
  synchronize: true,
  logging: false,
});