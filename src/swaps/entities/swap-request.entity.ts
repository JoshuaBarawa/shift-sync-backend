// swap-request.entity.ts
import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { User } from '../../users/entities/user.entity';
import { Shift } from '../../shifts/entities/shift.entity';

export enum SwapType {
  SWAP = 'swap',
  DROP = 'drop',
}

export enum SwapStatus {
  PENDING_ACCEPTANCE = 'pending_acceptance', // waiting for Staff B to accept (swap only)
  OPEN = 'open',                             // waiting for anyone to pick up (drop only)
  PENDING_APPROVAL = 'pending_approval',     // waiting for manager to approve
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Table({ tableName: 'swap_requests', timestamps: true })
export class SwapRequest extends Model<
  InferAttributes<SwapRequest>,
  InferCreationAttributes<SwapRequest>
> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  @Column({ type: DataType.ENUM(...Object.values(SwapType)), allowNull: false })
  declare type: SwapType;

  @Column({ type: DataType.ENUM(...Object.values(SwapStatus)), allowNull: false })
  declare status: SwapStatus;

  // Staff A — person initiating the request
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare requesterId: number;

  @BelongsTo(() => User, 'requesterId')
  declare requester: User;

  // Staff B — person being asked (nullable for drop requests)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare requesteeId: CreationOptional<number>;

  @BelongsTo(() => User, 'requesteeId')
  declare requestee: User;

  // Shift Staff A wants to give up
  @ForeignKey(() => Shift)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare requesterShiftId: number;

  @BelongsTo(() => Shift, 'requesterShiftId')
  declare requesterShift: Shift;

  // Shift Staff B would give in return (swap only)
  @ForeignKey(() => Shift)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare requesteeShiftId: CreationOptional<number>;

  @BelongsTo(() => Shift, 'requesteeShiftId')
  declare requesteeShift: Shift;

  // Manager who approved/rejected
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare managerId: CreationOptional<number>;

  @BelongsTo(() => User, 'managerId')
  declare manager: User;

  @Column({ type: DataType.STRING, allowNull: true })
  declare reason: CreationOptional<string>;

  @Column({ type: DataType.STRING, allowNull: true })
  declare rejectionReason: CreationOptional<string>;

  // Drop requests expire 24hrs before the shift
  @Column({ type: DataType.DATE, allowNull: true })
  declare expiresAt: CreationOptional<Date>;
}