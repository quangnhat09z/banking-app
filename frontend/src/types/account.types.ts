// src/types/account.types.ts
export interface Account {
  account_number: string;
  balance: string;
  currency: string;
  status: 'active' | 'locked';
  created_at: string;
}