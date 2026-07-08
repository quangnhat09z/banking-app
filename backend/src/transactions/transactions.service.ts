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
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationType } from 'src/notifications/entities/notification.entity';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Transaction)
        private readonly txRepo: Repository<Transaction>,
        @InjectRepository(Account)
        private readonly accountRepo: Repository<Account>,
        private readonly notificationsGateway: NotificationsGateway,
        private readonly notificationsService: NotificationsService,
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

            // 1. Lấy account_number của fromAccount KHÔNG LOCK 
            const fromAccountMeta = await accountRepo.findOne({
                where: { user_id: userId },
                select: {
                    id: true,
                    account_number: true,
                },
            });

            if (!fromAccountMeta) {
                throw new NotFoundException('Sender account not found');
            }

            // 2. Chống tự chuyển — check trước khi gọi lệnh lock 
            if (fromAccountMeta.account_number === dto.to_account_number) {
                throw new BadRequestException('Cannot transfer to the same account');
            }

            // 3: Xác định thứ tự lock dựa trên sort để CHỐNG DEADLOCK
            const shouldLockFromFirst =
                fromAccountMeta.account_number < dto.to_account_number;

            let fromAccount: Account | null = null;
            let toAccount: Account | null = null;

            if (shouldLockFromFirst) {
                // từ tài khoản số bé (from) -> số lớn (to)
                fromAccount = await accountRepo.findOne({
                    where: { user_id: userId },
                    lock: { mode: 'pessimistic_write' },
                });
                toAccount = await accountRepo.findOne({
                    where: { account_number: dto.to_account_number },
                    lock: { mode: 'pessimistic_write' },
                });
            } else {
                // từ tài khoản số bé (to) -> số lớn (from)
                toAccount = await accountRepo.findOne({
                    where: { account_number: dto.to_account_number },
                    lock: { mode: 'pessimistic_write' },
                });
                fromAccount = await accountRepo.findOne({
                    where: { user_id: userId },
                    lock: { mode: 'pessimistic_write' },
                });
            }

            // 3.5: Kiểm tra sự tồn tại của tài khoản 
            if (!fromAccount) {
                throw new NotFoundException('Sender account not found');
            }
            if (!toAccount) {
                throw new NotFoundException('Target account not found');
            }

            // 4. Validate trạng thái sau khi đã lock (Đảm bảo đọc data snapshot mới nhất)
            if (fromAccount.status !== AccountStatus.ACTIVE) {
                throw new BadRequestException('Sender account is not active');
            }

            if (toAccount.status !== AccountStatus.ACTIVE) {
                throw new BadRequestException('Target account is not active');
            }

            // 5. Kiểm tra số dư an toàn
            const currentBalance = parseFloat(fromAccount.balance);
            const transferAmount = parseFloat(dto.amount.toFixed(2));

            if (currentBalance < transferAmount) {
                throw new BadRequestException('Insufficient balance for the transfer');
            }

            // 6. Thực hiện trừ/cộng số dư
            fromAccount.balance = (currentBalance - transferAmount).toFixed(2);
            toAccount.balance = (parseFloat(toAccount.balance) + transferAmount).toFixed(2);

            await accountRepo.save(fromAccount);
            await accountRepo.save(toAccount);

            // 7. Lưu transaction record lưu vết lịch sử
            const transaction = txRepo.create({
                from_account_id: fromAccount.id,
                to_account_id: toAccount.id,
                amount: transferAmount.toFixed(2),
                type: TransactionType.TRANSFER,
                status: TransactionStatus.SUCCESS,
                description: dto.description ?? '',
                idempotency_key: dto.idempotency_key,
            });

            const savedTx = await txRepo.save(transaction);

            const receiverAccount = await manager.getRepository(Account).findOne({
                where: { id: toAccount.id },
            });

            if (receiverAccount) {
                const amountFormatted = new Intl.NumberFormat('vi-VN', {
                    style: 'currency', currency: 'VND',
                }).format(parseFloat(savedTx.amount));

                // Thông báo cho người GỬI
                const senderNotif = await this.notificationsService.create({
                    user_id: userId,
                    type: NotificationType.TRANSFER_SENT,
                    title: 'Chuyển khoản thành công',
                    body: `Bạn vừa chuyển ${amountFormatted} đến tài khoản ${toAccount.account_number}. 
                    Số dư còn lại: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(fromAccount.balance))}.`,
                });

                // Thông báo cho người NHẬN
                const receiverNotif = await this.notificationsService.create({
                    user_id: receiverAccount.user_id,
                    type: NotificationType.TRANSFER_RECEIVED,
                    title: 'Tiền vừa vào tài khoản',
                    body: `Tài khoản của bạn vừa nhận ${amountFormatted} từ tài khoản ${fromAccount.account_number}.`,
                });

                // Gửi real-time (chỉ nhận được nếu đang online)
                this.notificationsGateway.emitToUser(userId, senderNotif);
                this.notificationsGateway.emitToUser(receiverAccount.user_id, receiverNotif);
            }


            return this.formatTransactionResponse(savedTx, fromAccount.balance);
        });
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
