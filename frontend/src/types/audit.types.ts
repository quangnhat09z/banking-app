// src/types/audit.types.ts
export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'REGISTER'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_UNLOCKED'
    | 'ACCOUNT_DELETED'
    | 'TRANSFER_CREATED'
    | 'TRANSFER_REVERSED'
    | 'USER_UPDATED'
    | 'PASSWORD_CHANGED';

export type AuditEntity = 'users' | 'accounts' | 'transactions';

export interface AuditLog {
    id: string;
    actor_id: string | null;
    action: AuditAction;
    entity: AuditEntity;
    entity_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    before_data: Record<string, any> | null;
    after_data: Record<string, any> | null;
    created_at: string;
}

export interface AuditLogResponse {
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AuditLogFilters {
    page?: number;
    limit?: number;
    action?: AuditAction | 'all';
    entity?: AuditEntity | 'all';
}