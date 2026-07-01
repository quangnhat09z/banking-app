// src/transactions/transactions.service.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Account, AccountStatus } from '../accounts/entities/account.entity';
import {
    Transaction,
    TransactionStatus,
    TransactionType,
} from './entities/transaction.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import {
    GetTransactionsDto,
    TransactionDirection,
} from './dto/get-transactions.dto';
import { Brackets } from 'typeorm';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Transaction)
        private readonly txRepo: Repository<Transaction>,
        @InjectRepository(Account)
        private readonly accountRepo: Repository<Account>,
    ) { }

    async getHistory(userId: string, dto: GetTransactionsDto) {
        const { page = 1, limit = 10, direction, type } = dto;

        // 1. Lấy account của user hiện tại
        const account = await this.accountRepo.findOne({ where: { user_id: userId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        // 2. build query
        const queryBuilder = this.txRepo
            .createQueryBuilder('tx')
            .leftJoin('tx.fromAccount', 'fromAccount')
            .leftJoin('tx.toAccount', 'toAccount')
            .addSelect(['fromAccount.account_number', 'toAccount.account_number'])
            .orderBy('tx.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        // 3. filter theo direction
        switch (direction) {
            case TransactionDirection.SENT:
                queryBuilder.andWhere('tx.from_account_id = :accountId', { accountId: account.id });
                break;
            case TransactionDirection.RECEIVED:
                queryBuilder.andWhere('tx.to_account_id = :accountId', { accountId: account.id });
                break;
            default: // ALL
                queryBuilder.andWhere(
                    new Brackets((qb) => {
                        qb.where('tx.from_account_id = :accountId OR tx.to_account_id = :accountId', {
                            accountId: account.id,
                        });
                    }),
                );
        }

        // 4. filter theo type
        if (type) {
            queryBuilder.andWhere('tx.type = :type', { type });
        }

        // 5. Lây data, tổng số trang, tổng số bản ghi
        const [transactions, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        // 6. format response
        const data = transactions.map((tx) => {
            const isSent = tx.from_account_id === account.id;
            return {
                id: tx.id,
                amount: tx.amount,
                direction: isSent ? TransactionDirection.SENT : TransactionDirection.RECEIVED,
                counterparty_account: isSent ? tx.toAccount.account_number : tx.fromAccount.account_number,
                type: tx.type,
                status: tx.status,
                description: tx.description,
                created_at: tx.created_at,
            }
        });
        return {
            data,
            pagination: {
                total: total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            }
        };
    }

    async transfer(userId: string, dto: CreateTransferDto) {

        // 1. check idempotency_key
        const existingTransaction = await this.dataSource
            .getRepository(Transaction)
            .findOne({ where: { idempotency_key: dto.idempotency_key } });

        if (existingTransaction) {
            return this.formatTransactionResponse(existingTransaction);
        }

        // 2. check amount
        if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
            throw new BadRequestException('Amount is invalid');
        }

        const MAX_AMOUNT = 999_999_999_999.99;
        if (dto.amount > MAX_AMOUNT) {
            throw new BadRequestException(`Amount exceeds the maximum limit of ${MAX_AMOUNT}`);
        }

        // 3. thực hiện chuyển tiền trong transaction
        return this.dataSource.transaction(async (manager) => {
            const accountRepo = manager.getRepository(Account);
            const txRepo = manager.getRepository(Transaction);

            // 3a. check tài khoản nguồn của user hiện tại
            const fromAccount = await accountRepo.findOne({
                where: { user_id: userId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!fromAccount) {
                throw new NotFoundException('Sender account not found');
            }

            if (fromAccount.status !== AccountStatus.ACTIVE) {
                throw new BadRequestException('Sender account is not active');
            }

            // 3b. chống tự chuyển tiền
            if (fromAccount.account_number === dto.to_account_number) {
                throw new BadRequestException('Cannot transfer to the same account');
            }

            // 3c. Lấy account đích — CŨNG PHẢI LOCK
            //     Quan trọng: luôn lock theo thứ tự cố định (vd: theo account_number) để tránh deadlock
            //     khi 2 giao dịch ngược chiều xảy ra cùng lúc (A->B và B->A)
            const accountsInOrder = [fromAccount.account_number, dto.to_account_number].sort();
            const isFromFirst = accountsInOrder[0] === fromAccount.account_number;

            let toAccount: Account | null = null;
            if (isFromFirst) {
                // Nếu fromAccount nhỏ => đã được lock trước, nên lock toAccount sau (số lớn)
                toAccount = await accountRepo.findOne({
                    where: { account_number: dto.to_account_number },
                    lock: { mode: 'pessimistic_write' },
                });
            } else {
                // Nếu fromAccount lớn => lock toAccount trước (số nhỏ), rồi mới lock fromAccount (số lớn)
                toAccount = await accountRepo.findOne({
                    where: { account_number: dto.to_account_number },
                    lock: { mode: 'pessimistic_write' },
                });
            }
            if (!toAccount) {
                throw new NotFoundException('Target account not found');
            }

            if (toAccount.status !== AccountStatus.ACTIVE) {
                throw new BadRequestException('Target account is not active');
            }

            // 3d. check số dư
            const currentBalance = parseFloat(fromAccount.balance);
            const transferAmount = parseFloat(dto.amount.toFixed(2));
            if (currentBalance < transferAmount) {
                throw new BadRequestException('Insufficient balance for the transfer');
            }

            // 3e. thực hiện cộng/trừ
            const newFromBalance = (currentBalance - transferAmount).toFixed(2);
            const newToBalance = (parseFloat(toAccount.balance) + transferAmount).toFixed(2);

            fromAccount.balance = newFromBalance;
            toAccount.balance = newToBalance;

            await accountRepo.save(fromAccount);
            await accountRepo.save(toAccount);

            // 3f. tạo transaction record
            const transaction = txRepo.create({
                from_account_id: fromAccount.id,
                to_account_id: toAccount.id,
                amount: transferAmount.toFixed(2),
                type: TransactionType.TRANSFER,
                status: TransactionStatus.SUCCESS,
                description: dto.description ?? '',
                idempotency_key: dto.idempotency_key,
            });
            const savedTransaction = await txRepo.save(transaction);
            // Nếu bất kỳ bước nào ở trên throw error, toàn bộ sẽ tự động ROLLBACK
            // vì đang chạy trong this.dataSource.transaction()
            return this.formatTransactionResponse(savedTransaction, fromAccount.balance);
        })
    }


    private formatTransactionResponse(tx: Transaction, newBalance?: string) {
        return {
            message: 'Transaction processed successfully',
            transaction: {
                id: tx.id,
                amount: tx.amount,
                status: tx.status,
                description: tx.description,
                created_at: tx.created_at,
            },
            ...(newBalance && { new_balance: newBalance }),
        };
    }
}
