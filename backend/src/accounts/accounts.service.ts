import { Injectable } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
    constructor(
        @InjectRepository(Account)
        private readonly accountsRepository: Repository<Account>,
    ) { }

    // Sinh số tài khoản mới, đảm bảo không trùng lặp
    private async generateAccountNumber(): Promise<string> {
        let accountNumber: string;
        let isExisting: boolean;

        do {
            accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            isExisting = await this.accountsRepository.findOne({ where: { account_number: accountNumber } }) !== null;
        } while (isExisting);

        return accountNumber;
    }

    // Tạo tài khoản cho người dùng
    async createForUser(userId: string): Promise<Account> {
        const accountNumber = await this.generateAccountNumber();
        const newAccount = this.accountsRepository.create({
            user_id: userId,
            account_number: accountNumber,
            balance: '0',
            currency: 'VND',
        });
        return this.accountsRepository.save(newAccount);
    }

    async findByUserId(userId: string): Promise<Account[]> {
        return this.accountsRepository.find({ where: { user_id: userId } });
    }

    // Lấy thông tin tài khoản của người dùng hiện tại
    async getMyAccount(userId: string): Promise<Account> {
        const account = await this.accountsRepository.findOne({ where: { user_id: userId } });
        if (!account) {
            throw new Error('Account not found for the user');
        }
        return account;
    }

    // kiểm tra account theo account_number (dùng trong transaction)
    async findByAccountNumber(accountNumber: string): Promise<Account | null> {
        return this.accountsRepository.findOne({ where: { account_number: accountNumber } });
    }
}
