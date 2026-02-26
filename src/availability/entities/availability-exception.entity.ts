import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'availability_exceptions', timestamps: true })
export class AvailabilityException extends Model<
  InferAttributes<AvailabilityException>,
  InferCreationAttributes<AvailabilityException>
> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string; // e.g. "2026-03-15"

  @Column({ type: DataType.STRING, allowNull: true })
  declare startTime: CreationOptional<string>; // null = unavailable all day

  @Column({ type: DataType.STRING, allowNull: true })
  declare endTime: CreationOptional<string>;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isAvailable: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  declare reason: CreationOptional<string>; // e.g. "Doctor appointment"
}