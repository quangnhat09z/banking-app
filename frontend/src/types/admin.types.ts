
import type { PaginationMeta } from './pagination.types';

export interface AdminAccount {
    account_number: string;
    balance: string;
    status: 'active' | 'locked';
}

export type AdminUserPagination = PaginationMeta;

export interface AdminUser {
    id: string;
    full_name: string;
    email: string;
    role: 'customer' | 'admin';
    status: 'active' | 'locked';
    created_at: string;
    account: AdminAccount | null;
}

export interface GetUsersResponse {
    data: AdminUser[];
    pagination: AdminUserPagination;
}

export type UserStatusFilter = 'all' | 'active' | 'locked';
