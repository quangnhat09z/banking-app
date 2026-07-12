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
    const ip_address = request.ip || request.headers['x-forwarded-for'] || null;
    const user_agent = request.headers['user-agent'] || null;

    const before_data = request.auditBeforeData || null;

    return next.handle().pipe(
      tap(async (responseData) => {
        // Ghi log audit sau khi request thành công
        try {
          await this.auditService.log({
            actor_id,
            action: metadata.action,
            entity: metadata.entity,
            entity_id: request.params?.id ?? responseData?.id ?? null,
            ip_address,
            user_agent,
            before_data,
            after_data: responseData?.data || null,
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
}
