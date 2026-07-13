// src/audit/interceptors/audit.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AuditAction, AuditEntity } from '../entities/audit-log.entity';
import { AuditService } from '../audit.service';
import { User } from '../../users/entities/user.entity';

// Metadata key — dùng với @AuditLog() decorator
export const AUDIT_KEY = 'audit_metadata';

export interface AuditMetadata {
  action: AuditAction;
  entity: AuditEntity;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Lấy metadata từ decorator @AuditLog() 
    const metadata: AuditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler()
    );

    if (!metadata) return next.handle(); // Nếu không có metadata, tiếp tục xử lý request

    const request = context.switchToHttp().getRequest();
    const actor_id = request.user?.userId || null;
    const ip_address = this.resolveClientIp(request);
    const user_agent = request.headers['user-agent'] || null;

    const beforeDataPromise = this.resolveBeforeData(metadata.action, request);

    return next.handle().pipe(
      tap(async (responseData) => {
        // Ghi log audit sau khi request thành công
        try {
          const before_data = await beforeDataPromise;
          const after_data = await this.resolveAfterData(metadata.action, request, responseData, before_data);
          await this.auditService.log({
            actor_id,
            action: metadata.action,
            entity: metadata.entity,
            entity_id: this.resolveEntityId(request, responseData),
            ip_address,
            user_agent,
            before_data,
            after_data
          });
        } catch (err) {
          console.error('[AuditInterceptor] Failed to write audit log:', err);
        }
      }),

      catchError((err) => {
        // Chỉ log lỗi auth và forbidden — không log lỗi validation thông thường
        if (err.status === 401 || err.status === 403) {
          this.auditService.log({
            actor_id,
            action: metadata.action,
            entity: metadata.entity,
            entity_id: request.params?.id ?? null,
            ip_address,
            user_agent,
            before_data: null,
            after_data: { error: err.message, status: err.status },
          }).catch(console.error);
        }
        return throwError(() => err);
      })
    );
  }

  private async resolveBeforeData(action: AuditAction, request: any): Promise<Record<string, any> | null> {
    // Nếu trước đó đã có dữ liệu auditBeforeData, trả về nó
    if (request.auditBeforeData) return request.auditBeforeData;

    switch (action) {
      case AuditAction.LOGIN:
      case AuditAction.REGISTER:
        return request.body?.email ? { email: request.body.email } : null;

      case AuditAction.ACCOUNT_LOCKED:
      case AuditAction.ACCOUNT_UNLOCKED:
      case AuditAction.ACCOUNT_DELETED:
        return { target_user_id: request.params?.id };

      case AuditAction.USER_UPDATED:
        return this.resolveUserUpdateBeforeData(request);

      case AuditAction.TRANSFER_CREATED:
        return {
          to_account_number: request.body?.to_account_number,
          amount: request.body?.amount,
          description: request.body?.description,
        }

      case AuditAction.TRANSFER_REVERSED:
        return {
          original_transaction_id: request.params?.id,
        };

      default:
        return null;
    }
  }

  private async resolveUserUpdateBeforeData(request: any): Promise<Record<string, any> | null> {
    const userId = request.params?.id;
    if (!userId) return null;

    const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
    if (!user) return null;

    return {
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
    };
  }

  private async resolveAfterData(
    action: AuditAction,
    request: any,
    responseData: any,
    beforeData: Record<string, any> | null,
  ): Promise<Record<string, any> | null> {
    if (!responseData) return null;
    switch (action) {
      case AuditAction.LOGIN:
        return responseData?.user
          ? {
            user_id: responseData.user.id,
            full_name: responseData.user.full_name,
            email: responseData.user.email,
            role: responseData.user.role
          } : null;

      case AuditAction.REGISTER:
        return responseData?.user ? {
          user_id: responseData.user.id,
          full_name: responseData.user.full_name,
          email: responseData.user.email,
          account_number: responseData.account?.account_number,
        } : null;

      case AuditAction.TRANSFER_CREATED:
        return responseData.transaction
          ? {
            transaction_id: responseData.transaction.id,
            from_account_number: responseData.transaction.from_account_number,
            to_account_number: responseData.transaction.to_account_number,
            from_user_id: responseData.transaction.from_user_id,
            to_user_id: responseData.transaction.to_user_id,
            amount: responseData.transaction.amount,
            status: responseData.transaction.status,
            new_balance: responseData.new_balance,
          }
          : null;

      case AuditAction.TRANSFER_REVERSED:
        return responseData.reversal
          ? {
            reversal_id: responseData.reversal.id,
            original_transaction_id: responseData.reversal.original_transaction_id,
            status: responseData.reversal.status,
          }
          : null;

      case AuditAction.ACCOUNT_LOCKED:
      case AuditAction.ACCOUNT_UNLOCKED:
        return responseData.user
          ? {
            user_id: responseData.user.id,
            status: responseData.user.status,
          }
          : null;

      case AuditAction.ACCOUNT_DELETED:
        return this.resolveDeletedUserAfterData(request, responseData);

      case AuditAction.USER_UPDATED:
        return this.resolveUserUpdateAfterData(beforeData, responseData);

      default:
        const { password_hash, access_token, ...safe } = responseData;
        return Object.keys(safe).length > 0 ? safe : null;
    }
  }

  private async resolveDeletedUserAfterData(request: any, responseData: any): Promise<Record<string, any> | null> {
    const userId = request.params?.id;
    if (!userId) return { message: responseData.message };

    const deletedUser = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      withDeleted: true,
    });

    return {
      message: responseData.message ?? 'User soft deleted successfully',
      deleted_at: deletedUser?.deleted_at ?? null,
    };
  }

  private resolveUserUpdateAfterData(
    beforeData: Record<string, any> | null,
    responseData: any,
  ): Record<string, any> | null {
    if (!beforeData) return null;

    const changedBefore: Record<string, any> = {};
    const changedAfter: Record<string, any> = {};

    for (const [key, beforeValue] of Object.entries(beforeData)) {
      if (responseData[key] !== beforeValue) {
        changedBefore[key] = beforeValue;
        changedAfter[key] = responseData[key];
      }
    }

    Object.keys(beforeData).forEach((key) => delete beforeData[key]);
    Object.assign(beforeData, changedBefore);

    return Object.keys(changedAfter).length > 0 ? changedAfter : null;
  }

  private resolveEntityId(request: any, responseData: any): string | undefined {
    return (
      request.params?.id
      ?? responseData?.transaction?.id
      ?? responseData?.reversal?.id
      ?? responseData?.user?.id
      ?? responseData?.id
      ?? undefined
    );
  }

  private resolveClientIp(request: {
    ip?: string;
    headers: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
  }): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return this.normalizeIp(raw.trim());
    }

    const ip = request.ip ?? request.socket?.remoteAddress;
    return ip ? this.normalizeIp(ip) : undefined;
  }

  private normalizeIp(ip: string): string {
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }

    if (ip.startsWith('::ffff:')) {
      return ip.slice(7);
    }

    return ip;
  }
}
