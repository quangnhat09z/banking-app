
import type { PaginationMeta } from './pagination.types';

export interface AdminAccount {
    account_id: string;
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

export interface AccountHistory {
  id: string;
  account_id: string;
  change_type: 'EMAIL_CHANGED' | 'STATUS_CHANGED' | 'BALANCE_SNAPSHOT' | 'ACCOUNT_DELETED';
  before_data: Record<string, any>;
  after_data: Record<string, any> | null;
  changed_by: string | null;
  created_at: string;
}

export interface DeletedUser extends AdminUser {
  deleted_at: string;
}
