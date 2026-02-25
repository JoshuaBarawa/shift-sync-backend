// shift.entity.ts
import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Location } from '../../locations/entities/location.entity';
import { ShiftAssignment } from './shift-assignment.entity';

export enum ShiftStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
}

export enum RequiredSkill {
  BARTENDER = 'bartender',
  LINE_COOK = 'line_cook',
  SERVER = 'server',
  HOST = 'host',
  BUSSER = 'busser',
  DISHWASHER = 'dishwasher',
}

@Table({ tableName: 'shifts', timestamps: true })
export class Shift extends Model<InferAttributes<Shift>, InferCreationAttributes<Shift>> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  @ForeignKey(() => Location)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare locationId: number;

  @BelongsTo(() => Location)
  declare location: Location;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string; // e.g. "2026-03-15"

  @Column({ type: DataType.STRING, allowNull: false })
  declare startTime: string; // stored as UTC e.g. "14:00"

  @Column({ type: DataType.STRING, allowNull: false })
  declare endTime: string; // stored as UTC e.g. "22:00"

  @Column({ type: DataType.ENUM(...Object.values(RequiredSkill)), allowNull: false })
  declare requiredSkill: RequiredSkill;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare headcount: number; // how many staff needed

  @Column({ type: DataType.ENUM(...Object.values(ShiftStatus)), allowNull: false, defaultValue: ShiftStatus.DRAFT })
  declare status: CreationOptional<ShiftStatus>;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isPremium: CreationOptional<boolean>; // Friday/Saturday evening = premium

  @Column({ type: DataType.STRING, allowNull: true })
  declare notes: CreationOptional<string>;

  @HasMany(() => ShiftAssignment)
  declare assignments: ShiftAssignment[];
}