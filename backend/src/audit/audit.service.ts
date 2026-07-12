// src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditEntity } from './entities/audit-log.entity';

export interface CreateAuditLogDto {
    actor_id?: string;
    action: AuditAction;
    entity: AuditEntity;
    entity_id?: string;
    ip_address?: string;
    user_agent?: string;
    before_data?: Record<string, any> | null;
    after_data?: Record<string, any> | null;
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepo: Repository<AuditLog>,
    ) { }

    async log(dto: CreateAuditLogDto): Promise<void> {
        const auditLog = this.auditLogRepo.create(dto);
        await this.auditLogRepo.save(auditLog);
    }

    async findAll(page = 1, limit = 20) {
        const [logs, total] = await this.auditLogRepo.findAndCount({
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { 
            data: logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
         };
    }

    async findByEntity(entity: AuditEntity, entityId: string) {
        return this.auditLogRepo.find({
            where: { entity, entity_id: entityId },
            order: { created_at: 'DESC' },
        });
    }

    async findByActor(actorId: string) {
        return this.auditLogRepo.find({
            where: { actor_id: actorId },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }
}
