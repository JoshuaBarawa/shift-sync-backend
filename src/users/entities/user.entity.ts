import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
}

export enum Skill {
  BARTENDER = 'bartender',
  LINE_COOK = 'line_cook',
  SERVER = 'server',
  HOST = 'host',
  BUSSER = 'busser',
  DISHWASHER = 'dishwasher',
}

@Table({ tableName: 'users', timestamps: true })
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: CreationOptional<number>;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({ type: DataType.ENUM(...Object.values(Role)), allowNull: false, defaultValue: Role.STAFF })
  declare role: Role;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [] })
  declare skills: Skill[];

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: CreationOptional<boolean>;
}