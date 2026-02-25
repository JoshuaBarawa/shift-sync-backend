// availability.entity.ts
import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { User } from '../../users/entities/user.entity';

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

@Table({ tableName: 'availabilities', timestamps: true })
export class Availability extends Model<
  InferAttributes<Availability>,
  InferCreationAttributes<Availability>
> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare dayOfWeek: DayOfWeek; // 0=Sunday ... 6=Saturday

  @Column({ type: DataType.STRING, allowNull: false })
  declare startTime: string; // e.g. "09:00"

  @Column({ type: DataType.STRING, allowNull: false })
  declare endTime: string; // e.g. "17:00"

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isAvailable: boolean;
}