// audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog)
    private readonly auditModel: typeof AuditLog,
  ) {}

  // --- Core log method — everything calls this ---

  async log(
    performedById: number,
    action: AuditAction,
    resourceType: string,
    resourceId: number,
    summary: string,
    before?: Record<string, any>,
    after?: Record<string, any>,
  ): Promise<void> {
    await this.auditModel.create({
      performedById,
      action,
      resourceType,
      resourceId,
      summary,
      before,
      after,
    } as any);
  }

  // --- Query methods ---

  // Get full history of a specific resource e.g. shift #5
  async getResourceHistory(resourceType: string, resourceId: number): Promise<AuditLog[]> {
    return this.auditModel.findAll({
      where: { resourceType, resourceId },
      include: [{ model: User, as: 'performedBy', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  // Get all actions performed by a specific user
  async getUserActions(performedById: number): Promise<AuditLog[]> {
    return this.auditModel.findAll({
      where: { performedById },
      order: [['createdAt', 'DESC']],
    });
  }

  // Get all logs within a date range — for admin export
  async getLogs(filters: {
    startDate?: string;
    endDate?: string;
    action?: AuditAction;
    resourceType?: string;
    locationId?: number;
  }): Promise<AuditLog[]> {
    const where: any = {};

    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) where.createdAt[Op.lte] = new Date(filters.endDate + 'T23:59:59');
    }

    return this.auditModel.findAll({
      where,
      include: [{ model: User, as: 'performedBy', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
    });
  }
}