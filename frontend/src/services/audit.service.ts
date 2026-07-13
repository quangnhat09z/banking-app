// src/services/audit.service.ts
import axiosInstance from '../api/axios';
import type { AuditLog, AuditLogFilters, AuditLogResponse } from '../types/audit.types';

const auditService = {
  getAll: async (filters: AuditLogFilters): Promise<AuditLogResponse> => {
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v && v !== 'all'),
    );
    const res = await axiosInstance.get<AuditLogResponse>('/admin/audit-logs', {
      params: cleanParams,
    });
    console.log('res.data:', res.data);
    return res.data;
  },

  getByEntity: async (
    entity: string,
    entityId: string,
  ): Promise<AuditLog[]> => {
    const res = await axiosInstance.get<AuditLog[]>(
      `/admin/audit-logs/${entity}/${entityId}`,
    );
    // console.log('res.data by entity:', res.data);
    return res.data;
  },
};

export default auditService;