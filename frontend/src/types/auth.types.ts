// src/types/auth.types.ts
export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'customer' | 'admin';
  status: 'active' | 'locked';
  created_at: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
  account: {
    account_number: string;
    balance: string;
  };
}