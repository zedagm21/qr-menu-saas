import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import type { AdminOverviewMetrics, AdminRestaurantItem, AdminUserItem, AuditLogEntry } from '../types';

export const useAdminOverview = () => {
    return useQuery<AdminOverviewMetrics>({
        queryKey: ['admin-overview'],
        queryFn: () => adminApi.getOverview(),
        staleTime: 15_000,
    });
};

export const useAdminRestaurants = (params: { page?: number; limit?: number; search?: string; status?: string }) => {
    return useQuery<{ data: AdminRestaurantItem[]; pagination: any }>({
        queryKey: ['admin-restaurants', params],
        queryFn: () => adminApi.listRestaurants(params),
        staleTime: 15_000,
    });
};

export const useUpdateRestaurantAccess = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { isSuspended?: boolean; suspensionReason?: string | null; status?: string } }) =>
            adminApi.updateRestaurantAccess(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
            qc.invalidateQueries({ queryKey: ['admin-overview'] });
            qc.invalidateQueries({ queryKey: ['admin-activity'] });
        },
    });
};

export const useDeleteRestaurant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApi.deleteRestaurant(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
            qc.invalidateQueries({ queryKey: ['admin-overview'] });
            qc.invalidateQueries({ queryKey: ['admin-activity'] });
        },
    });
};

export const useAdminUsers = (params: { page?: number; limit?: number; search?: string; role?: string; verified?: string }) => {
    return useQuery<{ data: AdminUserItem[]; pagination: any }>({
        queryKey: ['admin-users', params],
        queryFn: () => adminApi.listUsers(params),
        staleTime: 15_000,
    });
};

export const useUpdateUserRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateUserRole(id, role),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['admin-overview'] });
            qc.invalidateQueries({ queryKey: ['admin-activity'] });
        },
    });
};

export const useVerifyUserEmail = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApi.verifyUserEmail(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['admin-overview'] });
            qc.invalidateQueries({ queryKey: ['admin-activity'] });
        },
    });
};

export const useDeleteUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApi.deleteUser(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['admin-overview'] });
            qc.invalidateQueries({ queryKey: ['admin-activity'] });
        },
    });
};

export const useAdminAuditLogs = (params: { page?: number; limit?: number; action?: string; search?: string }) => {
    return useQuery<{ data: AuditLogEntry[]; pagination: any }>({
        queryKey: ['admin-activity', params],
        queryFn: () => adminApi.listAuditLogs(params),
        staleTime: 10_000,
    });
};
