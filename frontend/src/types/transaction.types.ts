// src/types/transaction.types.ts
import type { PaginationMeta } from './pagination.types';

export interface Transaction {
  id: string;
  amount: string;
  direction: 'sent' | 'received';
  counterparty_account: string;
  type: 'transfer' | 'deposit' | 'withdrawal';
  status: 'pending' | 'success' | 'failed';
  description: string;
  created_at: string;
}

export type TransactionPagination = PaginationMeta;

export interface TransactionHistoryResponse {
  data: Transaction[];
  pagination: TransactionPagination;
}

export type TransactionDirection = 'all' | 'sent' | 'received';

export interface TransferPayload {
  to_account_number: string;
  amount: number;
  description?: string;
  idempotency_key: string;
}

export interface TransferResponse {
  message: string;
  transaction: {
    id: string;
    amount: string;
    status: string;
    description: string;
    created_at: string;
  };
  new_balance: string;
}
