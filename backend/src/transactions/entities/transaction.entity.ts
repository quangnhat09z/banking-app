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
  REVERSAL  = 'reversal'
}


export enum TransactionStatus {
  PENDING   = 'pending',
  COMPLETED = 'completed', 
  FAILED    = 'failed',
  REVERSED  = 'reversed',  // Giao dịch gốc đã bị hoàn tiền
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

  @Column({ unique: true, nullable: true, length: 100 })
  idempotency_key!: string;

  // Trỏ về giao dịch gốc khi đây là giao dịch REVERSAL
  @Column({ nullable: true })
  original_transaction_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @Column()
  from_account_id!: string;

  @Column()
  to_account_id!: string;

  @ManyToOne(() => Account, (account) => account.sentTransactions)
  @JoinColumn({ name: 'from_account_id' })
  fromAccount!: Account;

  @ManyToOne(() => Account, (account) => account.receivedTransactions)
  @JoinColumn({ name: 'to_account_id' })
  toAccount!: Account;
}