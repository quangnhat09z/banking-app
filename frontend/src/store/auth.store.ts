// src/store/auth.store.ts
import { create } from 'zustand';
import type { User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

// lấy dữ liệu user từ localStorage
const getInitialUser = (): User | null => {
  const savedUser = localStorage.getItem('user_info');
  if (!savedUser) return null;
  try {
    return JSON.parse(savedUser) as User;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  // Khởi tạo cả user và token từ localStorage để đảm bảo toàn vẹn dữ liệu khi reload trang
  user: getInitialUser(), 
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));