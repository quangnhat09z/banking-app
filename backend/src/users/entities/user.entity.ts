// src/users/entities/user.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  TELLER = 'teller',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  full_name!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at!: Date | null;

  @OneToMany(() => Account, (account) => account.user)
  accounts!: Account[];
}