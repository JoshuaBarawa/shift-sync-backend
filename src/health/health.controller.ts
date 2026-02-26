// this will avoid my render server from going idle
import { Controller, Get, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  @Get()
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  keepAlive() {
    this.logger.log(`Server alive at ${new Date().toISOString()}`);
  }
}