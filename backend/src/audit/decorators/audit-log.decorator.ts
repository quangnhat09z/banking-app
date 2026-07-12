// src/audit/decorators/audit-log.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { AUDIT_KEY, AuditMetadata } from '../interceptors/audit.interceptor';

export const AuditLog = (metadata: AuditMetadata) =>
  SetMetadata(AUDIT_KEY, metadata);