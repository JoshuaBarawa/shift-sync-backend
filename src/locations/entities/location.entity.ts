// location.entity.ts
import { Table, Column, Model, DataType, BelongsToMany } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { User } from '../../users/entities/user.entity';
import { UserLocation } from '../../users/entities/user-location.entity';

@Table({ tableName: 'locations', timestamps: true })
export class Location extends Model<InferAttributes<Location>, InferCreationAttributes<Location>> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare address: string;

  // IANA timezone string e.g. 'Africa/Nairobi', 'Africa/Johannesburg'
  @Column({ type: DataType.STRING, allowNull: false })
  declare timezone: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: CreationOptional<boolean>;

  @BelongsToMany(() => User, () => UserLocation)
  declare certifiedUsers: CreationOptional<User[]>;
}