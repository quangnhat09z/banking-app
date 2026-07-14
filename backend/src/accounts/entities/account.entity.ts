// src/accounts/entities/account.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToMany, JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum AccountStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 20 })
  account_number!: string;

  // Dùng type: 'numeric' — KHÔNG dùng float
  // TypeORM trả về string với numeric, cần parse khi tính toán
  @Column({ type: 'numeric', precision: 18, scale: 2, default: '0' })
  balance!: string;

  @Column({ length: 10, default: 'VND' })
  currency!: string;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status!: AccountStatus;

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @Column()
  user_id!: string;

  @ManyToOne(() => User, (user) => user.accounts)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => Transaction, (tx) => tx.fromAccount)
  sentTransactions!: Transaction[];

  @OneToMany(() => Transaction, (tx) => tx.toAccount)
  receivedTransactions!: Transaction[];

  @DeleteDateColumn({ nullable: true })
  deleted_at!: Date | null;
}