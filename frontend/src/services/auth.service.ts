// src/services/auth.service.ts
import axiosInstance from '../api/axios';
import type { AuthResponse, RegisterResponse } from '../types/auth.types';

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const authService = {
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const res = await axiosInstance.post<RegisterResponse>('/auth/register', payload);
    return res.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await axiosInstance.post<AuthResponse>('/auth/login', payload);
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
  },
};

export default authService;