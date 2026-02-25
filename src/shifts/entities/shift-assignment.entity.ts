// shift-assignment.entity.ts
import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Shift } from './shift.entity';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'shift_assignments', timestamps: true })
export class ShiftAssignment extends Model<
  InferAttributes<ShiftAssignment>,
  InferCreationAttributes<ShiftAssignment>
> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  @ForeignKey(() => Shift)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare shiftId: number;

  @BelongsTo(() => Shift)
  declare shift: Shift;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isConfirmed: CreationOptional<boolean>;
}