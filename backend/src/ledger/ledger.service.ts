// src/ledger/ledger.service.ts
import {
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LedgerEntry, LedgerEntryType } from './entities/ledger-entry.entity';

@Injectable()
export class LedgerService {

    // Ghi bút toán — chỉ INSERT, không UPDATE/DELETE 
    async writeEntry(
        manager: EntityManager,
        data: {
            account_id: string;
            transaction_id: string;
            type: LedgerEntryType;
            amount: string;
            balance_after: string;
        },
    ): Promise<LedgerEntry> {
        const repo = manager.getRepository(LedgerEntry);
        const entry = repo.create(data);
        return await manager.save(entry);
    }

    // Tính số dư từ ledger
    async calculateBalance(manager: EntityManager, account_id: string): Promise<number> {
        const result = await manager
            .getRepository(LedgerEntry)
            .createQueryBuilder('le')
            .select(
                `SUM(CASE WHEN le.type = 'CREDIT' THEN le.amount::numeric
                  WHEN le.type = 'DEBIT'  THEN -le.amount::numeric
                  ELSE 0 END)`,
                'net_balance',
            )
            .where('le.account_id = :account_id', { account_id })
            .getRawOne();

        return parseFloat(result?.net_balance ?? '0');
    }

    // kiểm tra số dư từ ledger có khớp với balance trên account
    async verifyBalance(manager: EntityManager, account_id: string, expectedBalance: string,): Promise<boolean> {
        const ledgerBalance = await this.calculateBalance(manager, account_id);
        return Math.abs(ledgerBalance - parseFloat(expectedBalance)) < 0.01;
    }

    // chặn UPDATE/DELETE ở tầng application
    updateEntry(): never {
        throw new ForbiddenException('Ledger entries are immutable — UPDATE is not allowed',);
    }

    deleteEntry(): never {
        throw new ForbiddenException('Ledger entries are immutable — DELETE is not allowed',);
    }

    // lấy lịch sử bút toán của một account
    async getEntriesByAccountId(manager: EntityManager, account_id: string, limit = 20): Promise<LedgerEntry[]> {
        return manager.getRepository(LedgerEntry)
            .find({
                where: { account_id },
                order: { created_at: 'DESC' },
                take: limit,
            });
    }

}
