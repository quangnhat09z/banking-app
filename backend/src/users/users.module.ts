import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { AccountHistory } from 'src/accounts/entities/account-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AccountHistory, Account])],
  providers: [UsersService], 
  exports: [UsersService],
})
export class UsersModule {}
