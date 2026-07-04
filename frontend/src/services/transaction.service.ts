// src/services/transaction.service.ts
import axiosInstance from '../api/axios';
import type { TransactionHistoryResponse, TransactionDirection, TransferPayload, TransferResponse } from '../types/transaction.types';

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  direction?: TransactionDirection;
}

const transactionService = {
  getHistory: async (params: GetTransactionsParams): Promise<TransactionHistoryResponse> => {
    const res = await axiosInstance.get<TransactionHistoryResponse>('/transactions', { params });
    return res.data;
  },
  
 transfer: async (payload: TransferPayload): Promise<TransferResponse> => {
    const res = await axiosInstance.post<TransferResponse>('/transactions/transfer', payload);
    return res.data;
  }
};

export default transactionService;