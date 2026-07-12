// src/audit/entities/audit-log.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum AuditAction {
  // Auth
  LOGIN             = 'LOGIN',
  LOGOUT            = 'LOGOUT',
  REGISTER          = 'REGISTER',

  // Account
  ACCOUNT_LOCKED    = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED  = 'ACCOUNT_UNLOCKED',
  ACCOUNT_DELETED   = 'ACCOUNT_DELETED',

  // Transaction
  TRANSFER_CREATED  = 'TRANSFER_CREATED',
  TRANSFER_REVERSED = 'TRANSFER_REVERSED',

  // User
  USER_UPDATED      = 'USER_UPDATED',
  PASSWORD_CHANGED  = 'PASSWORD_CHANGED',
}

export enum AuditEntity {
  USER        = 'users',
  ACCOUNT     = 'accounts',
  TRANSACTION = 'transactions',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Người thực hiện hành động (userId) — nullable khi chưa login
  @Column({ nullable: true })
  actor_id!: string;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  // Tên bảng bị tác động
  @Column({ type: 'enum', enum: AuditEntity })
  entity!: AuditEntity;

  // ID của bản ghi bị tác động
  @Column({ nullable: true })
  entity_id!: string;

  @Column({ nullable: true, length: 45 })
  ip_address!: string;

  @Column({ nullable: true, length: 500 })
  user_agent!: string;

  // Trạng thái TRƯỚC khi thay đổi
  @Column({ type: 'jsonb', nullable: true })
  before_data!: Record<string, any> | null;

  // Trạng thái SAU khi thay đổi
  @Column({ type: 'jsonb', nullable: true })
  after_data!: Record<string, any> | null;

  @CreateDateColumn()
  created_at!: Date;
}