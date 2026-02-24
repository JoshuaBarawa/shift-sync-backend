import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './database/config';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env.local', 
    }),

    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => databaseConfig(config),
      inject: [ConfigService],
    }),

    UsersModule,
    LocationsModule,
  ],
})
export class AppModule {}