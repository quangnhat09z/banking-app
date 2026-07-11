// src/ledger/entities/ledger-entry.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum LedgerEntryType {
  DEBIT  = 'DEBIT',  // Ghi nợ  — tiền ra khỏi tài khoản
  CREDIT = 'CREDIT', // Ghi có  — tiền vào tài khoản
}

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  account_id!: string;

  @Column()
  transaction_id!: string;

  @Column({ type: 'enum', enum: LedgerEntryType })
  type!: LedgerEntryType;

  // Số tiền của bút toán — luôn dương
  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  // Số dư tài khoản SAU KHI bút toán này được ghi — để audit dễ dàng
  @Column({ type: 'numeric', precision: 18, scale: 2 })
  balance_after!: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction!: Transaction;
}