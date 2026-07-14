// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { User } from './users/entities/user.entity';
import { Account } from './accounts/entities/account.entity';
import { Transaction } from './transactions/entities/transaction.entity'
import { AccountHistory } from './accounts/entities/account-history.entity';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';

import { LedgerModule } from './ledger/ledger.module';
import { LedgerEntry } from './ledger/entities/ledger-entry.entity';

import { AuditModule } from './audit/audit.module';
import { AuditLog } from './audit/entities/audit-log.entity';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [User, Account, Transaction, Notification, LedgerEntry, AuditLog, AccountHistory],
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    AdminModule,
    NotificationsModule,
    LedgerModule,
    AuditModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}