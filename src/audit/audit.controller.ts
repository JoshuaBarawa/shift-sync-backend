import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, Role } from '../users/entities/user.entity';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('shifts/:shiftId')
  @ApiOperation({ summary: 'Get full history of a shift — Manager/Admin only' })
  getShiftHistory(
    @Param('shiftId', ParseIntPipe) shiftId: number,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can view audit logs' };
    }
    return this.auditService.getResourceHistory('shift', shiftId);
  }

  @Get('swaps/:swapId')
  @ApiOperation({ summary: 'Get full history of a swap request — Manager/Admin only' })
  getSwapHistory(
    @Param('swapId', ParseIntPipe) swapId: number,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can view audit logs' };
    }
    return this.auditService.getResourceHistory('swap', swapId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get all audit logs with filters — Admin only' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: '2026-03-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: '2026-03-31' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'resourceType', required: false, type: String })
  getLogs(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('action') action?: AuditAction,
    @Query('resourceType') resourceType?: string,
  ) {
    if (user.role !== Role.ADMIN) {
      return { success: false, message: 'Only admins can export audit logs' };
    }
    return this.auditService.getLogs({ startDate, endDate, action, resourceType });
  }
}