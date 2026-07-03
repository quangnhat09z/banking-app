// src/services/transaction.service.ts
import axiosInstance from '../api/axios';
import type { TransactionHistoryResponse, TransactionDirection } from '../types/transaction.type';

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  direction?: TransactionDirection;
}

const transactionService = {
  getHistory: async (params: GetTransactionsParams): Promise<TransactionHistoryResponse> => {
    const res = await axiosInstance.get<TransactionHistoryResponse>('/transactions', { params });
    // console.log('Transaction history response:', res.data); // Log the response data
    return res.data;
  },
};

export default transactionService;