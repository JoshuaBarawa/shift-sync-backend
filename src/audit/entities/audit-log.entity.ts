import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  // Shifts
  SHIFT_CREATED = 'shift_created',
  SHIFT_UPDATED = 'shift_updated',
  SHIFT_PUBLISHED = 'shift_published',
  SHIFT_UNPUBLISHED = 'shift_unpublished',
  SHIFT_CANCELLED = 'shift_cancelled',
  STAFF_ASSIGNED = 'staff_assigned',
  STAFF_UNASSIGNED = 'staff_unassigned',

  // Swaps
  SWAP_REQUESTED = 'swap_requested',
  SWAP_ACCEPTED = 'swap_accepted',
  SWAP_DECLINED = 'swap_declined',
  SWAP_APPROVED = 'swap_approved',
  SWAP_REJECTED = 'swap_rejected',
  SWAP_CANCELLED = 'swap_cancelled',
  DROP_PICKED_UP = 'drop_picked_up',

  // Users
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DEACTIVATED = 'user_deactivated',

  // Certifications
  USER_CERTIFIED = 'user_certified',
  USER_DECERTIFIED = 'user_decertified',
}

@Table({ tableName: 'audit_logs', timestamps: true, updatedAt: false })
export class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  // who performed the action
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare performedById: number;

  @BelongsTo(() => User, 'performedById')
  declare performedBy: User;

  @Column({ type: DataType.ENUM(...Object.values(AuditAction)), allowNull: false })
  declare action: AuditAction;

  // what type of resource was affected
  @Column({ type: DataType.STRING, allowNull: false })
  declare resourceType: string; // 'shift', 'swap', 'user', 'location'

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare resourceId: number;

  // snapshot of before and after state
  @Column({ type: DataType.JSON, allowNull: true })
  declare before: CreationOptional<Record<string, any>>;

  @Column({ type: DataType.JSON, allowNull: true })
  declare after: CreationOptional<Record<string, any>>;

  // human readable summary
  @Column({ type: DataType.TEXT, allowNull: false })
  declare summary: string;
}