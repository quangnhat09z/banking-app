// src/services/account.service.ts
import axiosInstance from '../api/axios';
import type { Account } from '../types/account.types';

const accountService = {
  getMyAccount: async (): Promise<Account> => {
    const res = await axiosInstance.get<Account>('/accounts/me');
    return res.data;
  },
};

export default accountService;