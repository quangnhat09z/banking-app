// src/transactions/dto/get-transactions.dto.ts
import { IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../entities/transaction.entity';

export enum TransactionDirection {
  SENT = 'sent',         // tiền ra
  RECEIVED = 'received', // tiền vào
  ALL = 'all',           // tất cả
}

export class GetTransactionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(TransactionDirection)
  direction?: TransactionDirection = TransactionDirection.ALL;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}