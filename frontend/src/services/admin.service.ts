import axiosInstance from "../api/axios";
import type { GetUsersResponse, UserStatusFilter, DeletedUser, AccountHistory } from "../types/admin.types";

export interface GetUsersParams {
    page?: number;
    limit?: number;
    status?: UserStatusFilter;
    search?: string;
}

const adminService = {
    getUsers: async (params: GetUsersParams): Promise<GetUsersResponse> => {
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v && v !== 'all'),
        );
        const res = await axiosInstance.get<GetUsersResponse>('/admin/users', {
            params: cleanParams,
        });
        return res.data;
    },

    updateUserStatus: async (id: string, status: UserStatusFilter): Promise<void> => {
        await axiosInstance.patch(`/admin/users/${id}/status`, { status });
    },

    softDeleteUser: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/admin/users/${id}`);
    },

    getDeletedUsers: async (): Promise<DeletedUser[]> => {
        const res = await axiosInstance.get<DeletedUser[]>('/admin/users/deleted');
        return res.data;
    },

    updateEmail: async (id: string, email: string): Promise<void> => {
        await axiosInstance.patch(`/admin/users/${id}/email`, { email });
    },

    getAccountHistory: async (accountId: string): Promise<AccountHistory[]> => {
        const res = await axiosInstance.get<AccountHistory[]>(
            `/admin/users/${accountId}/history`,
        );
        return res.data;
    },

};

export default adminService;