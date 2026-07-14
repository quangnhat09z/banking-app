// backend/src/users/users.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { AccountHistory, AccountHistoryChangeType } from 'src/accounts/entities/account-history.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Account)
        private readonly accountRepo: Repository<Account>,
        @InjectRepository(AccountHistory)
        private readonly historyRepo: Repository<AccountHistory>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { email } });
    }

    async findById(id: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { id } });
    }

    async create(data: Partial<User>): Promise<User> {
        const user = this.userRepo.create(data);
        return this.userRepo.save(user);
    }

    async softDeleteUser(userId: string, deletedBy: string): Promise<void> {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: { accounts: true },
        });

        if (!user) throw new NotFoundException('User not found');
        
        // Lưu history trước khi soft delete
        for (const account of user.accounts ?? []) {
            const history = this.historyRepo.create({
                account_id: account.id,
                change_type: AccountHistoryChangeType.ACCOUNT_DELETED,
                before_data: {
                    status: account.status,
                    balance: account.balance,
                    email: user.email,
                },
                after_data: { deleted: true },
                changed_by: deletedBy,
            });
            await this.historyRepo.save(history);

            // Soft delete account
            await this.accountRepo.softDelete(account.id);
        }

        // Soft delete user — TypeORM set deleted_at = NOW()
        await this.userRepo.softDelete(userId);
    }

    async updateEmail(userId: string, newEmail: string, changeBy: string): Promise<User | null> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const emailTaken = await this.userRepo.findOne({ where: { email: newEmail } });
        if (emailTaken) throw new BadRequestException('Email is already taken');

        // lưu snapshot dữ liệu trước khi thay đổi
        const admin = await this.userRepo.findOne({ where: { id: changeBy } });
        const account = await this.accountRepo.findOne({ where: { user_id: userId } });
        if (account) {
            const history = this.historyRepo.create({
                account_id: account.id,
                change_type: AccountHistoryChangeType.EMAIL_CHANGED,
                before_data: { email: user.email },
                after_data: { email: newEmail },
                changed_by: admin?.full_name || 'Unknown Admin',
            });
            await this.historyRepo.save(history);
        }

        user.email = newEmail;
        return this.userRepo.save(user);
    }


    async getAccountHistory(accountId: string): Promise<AccountHistory[]> {
        return this.historyRepo.find({
            where: { account_id: accountId },
            order: { created_at: 'DESC' },
        });
    }

    async findDeletedUsers() {
        const users = await this.userRepo
            .createQueryBuilder('user')
            .withDeleted()
            .leftJoinAndSelect('user.accounts', 'account')
            .select([
                'user.id',
                'user.full_name',
                'user.email',
                'user.role',
                'user.status',
                'user.created_at',
                'user.deleted_at',
                'account.id',
                'account.account_number',
                'account.balance',
                'account.status',
            ])
            .where('user.deleted_at IS NOT NULL')
            .orderBy('user.deleted_at', 'DESC')
            .getMany();

        return users.map((user) => ({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            status: user.status,
            created_at: user.created_at,
            deleted_at: user.deleted_at,
            account: user.accounts?.[0]
                ? {
                    account_id: user.accounts[0].id,
                    account_number: user.accounts[0].account_number,
                    balance: user.accounts[0].balance,
                    status: user.accounts[0].status,
                }
                : null,
        }));
    }
}
