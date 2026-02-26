// user-location.entity.ts
import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { User } from './user.entity';
import { Location } from '../../locations/entities/location.entity';

@Table({ tableName: 'user_locations', timestamps: true })
export class UserLocation extends Model<
  InferAttributes<UserLocation>,
  InferCreationAttributes<UserLocation>
> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Location)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare locationId: number;

  @BelongsTo(() => Location)
  declare location: Location;
}