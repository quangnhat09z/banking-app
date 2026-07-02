// src/types/transaction.types.ts
export interface Transaction {
  id: string;
  amount: string;
  direction: 'sent' | 'received';
  counterpart_account: string;
  type: 'transfer' | 'deposit' | 'withdrawal';
  status: 'pending' | 'success' | 'failed';
  description: string;
  created_at: string;
}

export interface TransactionPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TransactionHistoryResponse {
  data: Transaction[];
  pagination: TransactionPagination;
}

export type TransactionDirection = 'all' | 'sent' | 'received';