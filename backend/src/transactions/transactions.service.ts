// src/transactions/transactions.service.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
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

import { LedgerService } from '../ledger/ledger.service';
import { LedgerEntryType } from '../ledger/entities/ledger-entry.entity';

import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationType } from 'src/notifications/entities/notification.entity';

// State machine — định nghĩa các transition hợp lệ
const VALID_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
    [TransactionStatus.PENDING]: [TransactionStatus.COMPLETED, TransactionStatus.FAILED],
    [TransactionStatus.COMPLETED]: [TransactionStatus.REVERSED],
    [TransactionStatus.FAILED]: [], // terminal state
    [TransactionStatus.REVERSED]: [], // terminal state
};

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
        private readonly ledgerService: LedgerService,
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

    // src/transactions/transactions.service.ts
    async transfer(userId: string, dto: CreateTransferDto) {

        // 1. Chống double-submit
        const existingTransaction = await this.dataSource
            .getRepository(Transaction)
            .findOne({ where: { idempotency_key: dto.idempotency_key } });

        if (existingTransaction) {
            return this.formatTransactionResponse(existingTransaction);
        }

        // 2. Validate số tiền
        if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
            throw new BadRequestException('Amount is invalid');
        }

        const MAX_AMOUNT = 999_999_999_999.99;
        if (dto.amount > MAX_AMOUNT) {
            throw new BadRequestException(`Amount exceeds the maximum limit of ${MAX_AMOUNT}`);
        }

        return this.dataSource.transaction(async (manager) => {
            const accountRepo = manager.getRepository(Account);
            const txRepo = manager.getRepository(Transaction);

            // 3. Lấy account_number KHÔNG LOCK — chỉ để sort
            const fromAccountMeta = await accountRepo.findOne({
                where: { user_id: userId },
                select: { id: true, account_number: true },
            });

            if (!fromAccountMeta) {
                throw new NotFoundException('Sender account not found');
            }

            if (fromAccountMeta.account_number === dto.to_account_number) {
                throw new BadRequestException('Cannot transfer to the same account');
            }

            // 4. Lock theo thứ tự cố định — chống deadlock
            const shouldLockFromFirst =
                fromAccountMeta.account_number < dto.to_account_number;

            let fromAccount: Account | null = null;
            let toAccount: Account | null = null;

            if (shouldLockFromFirst) {
                fromAccount = await accountRepo.findOne({
                    where: { user_id: userId },
                    lock: { mode: 'pessimistic_write' },
                });
                toAccount = await accountRepo.findOne({
                    where: { account_number: dto.to_account_number },
                    lock: { mode: 'pessimistic_write' },
                });
            } else {
                toAccount = await accountRepo.findOne({
                    where: { account_number: dto.to_account_number },
                    lock: { mode: 'pessimistic_write' },
                });
                fromAccount = await accountRepo.findOne({
                    where: { user_id: userId },
                    lock: { mode: 'pessimistic_write' },
                });
            }

            if (!fromAccount) throw new NotFoundException('Sender account not found');
            if (!toAccount) throw new NotFoundException('Target account not found');

            // 5. Validate sau khi lock (đọc data mới nhất)
            if (fromAccount.status !== AccountStatus.ACTIVE) {
                throw new BadRequestException('Sender account is not active');
            }
            if (toAccount.status !== AccountStatus.ACTIVE) {
                throw new BadRequestException('Target account is not active');
            }

            // 6. Kiểm tra số dư
            const currentBalance = parseFloat(fromAccount.balance);
            const transferAmount = parseFloat(dto.amount.toFixed(2));

            if (currentBalance < transferAmount) {
                throw new BadRequestException('Insufficient balance for the transfer');
            }

            // 7. Cập nhật balance
            const newFromBalance = (currentBalance - transferAmount).toFixed(2);
            const newToBalance = (parseFloat(toAccount.balance) + transferAmount).toFixed(2);

            fromAccount.balance = newFromBalance;
            toAccount.balance = newToBalance;

            await accountRepo.save(fromAccount);
            await accountRepo.save(toAccount);

            // 8. Tạo transaction record — bắt đầu từ PENDING
            const transaction = txRepo.create({
                from_account_id: fromAccount.id,
                to_account_id: toAccount.id,
                amount: transferAmount.toFixed(2),
                type: TransactionType.TRANSFER,
                status: TransactionStatus.PENDING,
                description: dto.description ?? '',
                idempotency_key: dto.idempotency_key,
            });
            const savedTx = await txRepo.save(transaction);

            // 9. Ghi 2 bút toán vào ledger (Double-entry)
            //    DEBIT  — ghi nợ người gửi  (tiền ra)
            //    CREDIT — ghi có người nhận (tiền vào)
            //    Tổng DEBIT = Tổng CREDIT = transferAmount → sổ cái cân bằng
            await this.ledgerService.writeEntry(manager, {
                account_id: fromAccount.id,
                transaction_id: savedTx.id,
                type: LedgerEntryType.DEBIT,
                amount: transferAmount.toFixed(2),
                balance_after: newFromBalance,
            });

            await this.ledgerService.writeEntry(manager, {
                account_id: toAccount.id,
                transaction_id: savedTx.id,
                type: LedgerEntryType.CREDIT,
                amount: transferAmount.toFixed(2),
                balance_after: newToBalance,
            });

            // 10. Chuyển PENDING → COMPLETED (state machine)
            this.assertValidTransition(savedTx.status, TransactionStatus.COMPLETED);
            savedTx.status = TransactionStatus.COMPLETED;
            await txRepo.save(savedTx);

            // 11. Gửi notifications — 
            //     Nằm SAU khi ledger và state machine đã hoàn tất
            //     Nếu notification fail thì KHÔNG rollback transaction
            const receiverAccount = await accountRepo.findOne({
                where: { id: toAccount.id },
            });

            if (receiverAccount) {
                const amountFormatted = new Intl.NumberFormat('vi-VN', {
                    style: 'currency', currency: 'VND',
                }).format(transferAmount);

                const senderNotif = await this.notificationsService.create({
                    user_id: userId,
                    type: NotificationType.TRANSFER_SENT,
                    title: 'Transfer successful',
                    body: `You have transferred ${amountFormatted} to account ${toAccount.account_number}. ` +
                        `Remaining balance: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(newFromBalance))}.`,
                });

                const receiverNotif = await this.notificationsService.create({
                    user_id: receiverAccount.user_id,
                    type: NotificationType.TRANSFER_RECEIVED,
                    title: 'Money received',
                    body: `You have received ${amountFormatted} from account ${fromAccount.account_number}.`,
                });

                this.notificationsGateway.emitToUser(userId, senderNotif);
                this.notificationsGateway.emitToUser(receiverAccount.user_id, receiverNotif);
            }

            return this.formatTransactionResponse(savedTx, newFromBalance);
        });
    }

    //  Hoàn tiền (Reversal) 
    async reverseTransaction(originalTxId: string, requesterId: string) {
        return this.dataSource.transaction(async (manager) => {
            const txRepo = manager.getRepository(Transaction);
            const accountRepo = manager.getRepository(Account);

            // 1. Lấy giao dịch gốc
            const originalTx = await txRepo.findOne({
                where: { id: originalTxId },
                relations: {
                    fromAccount: true,
                    toAccount: true,
                },
            });

            if (!originalTx) throw new NotFoundException('Transaction not found');

            // 2. Kiểm tra chưa có reversal nào cho giao dịch này
            const existingReversal = await txRepo.findOne({
                where: { original_transaction_id: originalTxId },
            });

            if (existingReversal) {
                throw new ConflictException(
                    `Transaction ${originalTxId} has already been reversed`,
                );
            }

            // 3. Kiểm tra transition hợp lệ: COMPLETED → REVERSED
            this.assertValidTransition(originalTx.status, TransactionStatus.REVERSED);


            // 4. Kiểm tra requester có phải chủ tài khoản nguồn không
            const requesterAccount = await accountRepo.findOne({
                where: { user_id: requesterId },
            });

            if (!requesterAccount || requesterAccount.id !== originalTx.from_account_id) {
                throw new BadRequestException(
                    'Only the sender can reverse this transaction',
                );
            }

            const reversalAmount = parseFloat(originalTx.amount);

            // 5. Lock 2 account theo thứ tự cố định — tương tự transfer
            const fromAcc = originalTx.fromAccount;
            const toAcc = originalTx.toAccount;

            const shouldLockFromFirst = fromAcc.account_number < toAcc.account_number;

            let senderAccount: Account;
            let receiverAccount: Account;

            if (shouldLockFromFirst) {
                senderAccount = await accountRepo.findOneOrFail({
                    where: { id: fromAcc.id },
                    lock: { mode: 'pessimistic_write' },
                });
                receiverAccount = await accountRepo.findOneOrFail({
                    where: { id: toAcc.id },
                    lock: { mode: 'pessimistic_write' },
                });
            } else {
                receiverAccount = await accountRepo.findOneOrFail({
                    where: { id: toAcc.id },
                    lock: { mode: 'pessimistic_write' },
                });
                senderAccount = await accountRepo.findOneOrFail({
                    where: { id: fromAcc.id },
                    lock: { mode: 'pessimistic_write' },
                });
            }

            // 6. Kiểm tra người nhận có đủ tiền để hoàn không
            const receiverBalance = parseFloat(receiverAccount.balance);
            if (receiverBalance < reversalAmount) {
                throw new BadRequestException(
                    'Receiver does not have sufficient balance to reverse this transaction',
                );
            }

            // 7. Tạo giao dịch REVERSAL — không sửa giao dịch gốc
            const reversalTx = txRepo.create({
                from_account_id: toAcc.id,   // chiều ngược lại
                to_account_id: fromAcc.id,
                amount: originalTx.amount,
                type: TransactionType.REVERSAL,
                status: TransactionStatus.PENDING,
                description: `Reversal of transaction ${originalTxId}`,
                original_transaction_id: originalTxId,
            });
            const savedReversal = await txRepo.save(reversalTx);

            // 8. Cập nhật balance — đảo chiều tiền
            const newReceiverBalance = (receiverBalance - reversalAmount).toFixed(2);
            const newSenderBalance = (parseFloat(senderAccount.balance) + reversalAmount).toFixed(2);

            receiverAccount.balance = newReceiverBalance;
            senderAccount.balance = newSenderBalance;

            await accountRepo.save(receiverAccount);
            await accountRepo.save(senderAccount);

            // 9. Ghi 2 bút toán đảo ngược vào ledger
            await this.ledgerService.writeEntry(manager, {
                account_id: receiverAccount.id,
                transaction_id: savedReversal.id,
                type: LedgerEntryType.DEBIT,  // trừ tiền người nhận gốc
                amount: originalTx.amount,
                balance_after: newReceiverBalance,
            });

            await this.ledgerService.writeEntry(manager, {
                account_id: senderAccount.id,
                transaction_id: savedReversal.id,
                type: LedgerEntryType.CREDIT, // hoàn tiền người gửi gốc
                amount: originalTx.amount,
                balance_after: newSenderBalance,
            });

            // 10. Chuyển trạng thái reversal PENDING → COMPLETED
            this.assertValidTransition(savedReversal.status, TransactionStatus.COMPLETED);
            savedReversal.status = TransactionStatus.COMPLETED;
            await txRepo.save(savedReversal);

            // 11. Đánh dấu giao dịch gốc là REVERSED — KHÔNG sửa nội dung gốc
            this.assertValidTransition(originalTx.status, TransactionStatus.REVERSED);
            originalTx.status = TransactionStatus.REVERSED;
            await txRepo.save(originalTx);

            // 12. Gửi notifications cho reversal
            const amountFormatted = new Intl.NumberFormat('vi-VN', {
                style: 'currency', currency: 'VND',
            }).format(parseFloat(originalTx.amount));

            // Thông báo cho người gửi gốc (nhận lại tiền)
            const senderNotif = await this.notificationsService.create({
                user_id: requesterId,
                type: NotificationType.TRANSFER_RECEIVED,
                title: 'Refund successful',
                body: `Your transaction of ${amountFormatted} has been reversed. ` +
                    `Amount refunded to your account.`,
            });

            // Thông báo cho người nhận gốc (bị trừ lại tiền)
            const receiverOriginal = await manager.getRepository(Account).findOne({
                where: { id: originalTx.to_account_id },
            });

            if (receiverOriginal) {
                const receiverNotif = await this.notificationsService.create({
                    user_id: receiverOriginal.user_id,
                    type: NotificationType.TRANSFER_SENT,
                    title: 'Transaction reversed',
                    body: `A transaction of ${amountFormatted} received from account ` +
                        `${originalTx.fromAccount.account_number} has been reversed.`,
                });

                this.notificationsGateway.emitToUser(receiverOriginal.user_id, receiverNotif);
            }

            this.notificationsGateway.emitToUser(requesterId, senderNotif);

            return {
                message: 'Transaction reversed successfully',
                reversal: {
                    id: savedReversal.id,
                    amount: savedReversal.amount,
                    status: savedReversal.status,
                    original_transaction_id: originalTxId,
                    created_at: savedReversal.created_at,
                },
                original_transaction: {
                    id: originalTx.id,
                    status: originalTx.status,
                },
            };
        });
    }


    private assertValidTransition(current: TransactionStatus, next: TransactionStatus): void {
        const allowed = VALID_TRANSITIONS[current];
        if (!allowed.includes(next)) {
            throw new BadRequestException(
                `Invalid transition: ${current} → ${next}.`
            );
        }
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
