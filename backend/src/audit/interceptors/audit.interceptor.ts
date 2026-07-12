// src/audit/interceptors/audit.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuditAction, AuditEntity } from '../entities/audit-log.entity';
import { AuditService } from '../audit.service';

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

    const before_data = this.resolveBeforeData(metadata.action, request);

    return next.handle().pipe(
      tap(async (responseData) => {
        // Ghi log audit sau khi request thành công
        try {
          const after_data = this.resolveAfterData(metadata.action, responseData);
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
            before_data,
            after_data: { error: err.message, status: err.status },
          }).catch(console.error);
        }
        return throwError(() => err);
      })
    );
  }

  private resolveBeforeData(action: AuditAction, request: any): Record<string, any> | null {
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

  private resolveAfterData(action: AuditAction, responseData: any): Record<string, any> | null {
    if (!responseData) return null;
    switch (action) {
      case AuditAction.LOGIN:
        return responseData?.user
          ? {
            user_id: responseData.user.id,
            email: responseData.user.email,
            role: responseData.user.role
          } : null;

      case AuditAction.REGISTER:
        return responseData?.user ? {
          user_id: responseData.user.id,
          email: responseData.user.email,
          account_number: responseData.account?.account_number,
        } : null;

      case AuditAction.TRANSFER_CREATED:
        return responseData.transaction
          ? {
            transaction_id: responseData.transaction.id,
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

      default:
        const { password_hash, access_token, ...safe } = responseData;
        return Object.keys(safe).length > 0 ? safe : null;
    }
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
