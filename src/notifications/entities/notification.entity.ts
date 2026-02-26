
import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  SHIFT_ASSIGNED = 'shift_assigned',
  SHIFT_UNASSIGNED = 'shift_unassigned',
  SHIFT_PUBLISHED = 'shift_published',
  SHIFT_EDITED = 'shift_edited',
  SHIFT_CANCELLED = 'shift_cancelled',
  SWAP_REQUESTED = 'swap_requested',
  SWAP_ACCEPTED = 'swap_accepted',
  SWAP_DECLINED = 'swap_declined',
  SWAP_APPROVED = 'swap_approved',
  SWAP_REJECTED = 'swap_rejected',
  SWAP_CANCELLED = 'swap_cancelled',
  DROP_PICKED_UP = 'drop_picked_up',
  OVERTIME_WARNING = 'overtime_warning',
}

@Table({ tableName: 'notifications', timestamps: true })
export class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  // who receives this notification
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.ENUM(...Object.values(NotificationType)), allowNull: false })
  declare type: NotificationType;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare message: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isRead: CreationOptional<boolean>;

  // optional reference to the related resource
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare resourceId: CreationOptional<number>; // shiftId or swapId

  @Column({ type: DataType.STRING, allowNull: true })
  declare resourceType: CreationOptional<string>; // 'shift' or 'swap'
}