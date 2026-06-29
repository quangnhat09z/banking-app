// src/transactions/entities/transaction.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

export enum TransactionType {
  TRANSFER = 'transfer',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'enum', enum: TransactionType, default: TransactionType.TRANSFER })
  type!: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Column({ length: 255, nullable: true })
  description!: string;

  // Chống double-submit: mỗi request sinh 1 key duy nhất
  @Column({ unique: true, nullable: true, length: 100 })
  idempotency_key!: string;

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @Column()
  from_account_id!: string;

  @Column()
  to_account_id!  : string;

  @ManyToOne(() => Account, (account) => account.sentTransactions)
  @JoinColumn({ name: 'from_account_id' })
  fromAccount!: Account;

  @ManyToOne(() => Account, (account) => account.receivedTransactions)
  @JoinColumn({ name: 'to_account_id' })
  toAccount!: Account;
}