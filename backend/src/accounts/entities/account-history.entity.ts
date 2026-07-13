// src/accounts/entities/account-history.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Account } from './account.entity';

export enum AccountHistoryChangeType {
  EMAIL_CHANGED    = 'EMAIL_CHANGED',
  STATUS_CHANGED   = 'STATUS_CHANGED',
  BALANCE_SNAPSHOT = 'BALANCE_SNAPSHOT',
  ACCOUNT_DELETED  = 'ACCOUNT_DELETED',
}

@Entity('account_history')
export class AccountHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  account_id!: string;

  @Column({ type: 'enum', enum: AccountHistoryChangeType })
  change_type!: AccountHistoryChangeType;

  // Snapshot toàn bộ dữ liệu TRƯỚC khi thay đổi
  @Column({ type: 'jsonb' })
  before_data!: Record<string, any>;

  // Snapshot toàn bộ dữ liệu SAU khi thay đổi
  @Column({ type: 'jsonb', nullable: true })
  after_data!: Record<string, any> | null;

  @Column({ nullable: true })
  changed_by!: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account!: Account;
}