// src/auth/entities/refresh-token.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  // Lưu hash của token — không lưu plaintext
  @Column({ unique: true })
  token_hash!: string;

  // Thông tin thiết bị để hiển thị "phiên đăng nhập"
  @Column({ nullable: true, length: 500 })
  user_agent!: string;

  @Column({ nullable: true, length: 45 })
  ip_address!: string;

  @Column()
  expires_at!: Date;

  // true = đã bị revoke (logout, đổi mật khẩu)
  @Column({ default: false })
  is_revoked!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}