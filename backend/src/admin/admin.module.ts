// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Account } from '../accounts/entities/account.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account]),
    AuthModule,
    AuditModule, 
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}