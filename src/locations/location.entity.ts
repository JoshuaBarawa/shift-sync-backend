import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

@Table({ tableName: 'locations', timestamps: true })
export class Location extends Model<InferAttributes<Location>, InferCreationAttributes<Location>> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare address: string;

  // IANA timezone string e.g. 'America/New_York', 'America/Los_Angeles'
  @Column({ type: DataType.STRING, allowNull: false })
  declare timezone: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: CreationOptional<boolean>;
}