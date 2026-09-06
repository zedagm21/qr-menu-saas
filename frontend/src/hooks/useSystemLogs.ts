import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemLogsApi } from '../services/api';
import type { SystemLogEntry, SystemLogMetrics } from '../types';

export interface UseSystemLogsParams {
    page?: number;
    limit?: number;
    level?: string;
    source?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

export const useSystemLogs = (params: UseSystemLogsParams, refetchInterval?: number) => {
    return useQuery<{ data: SystemLogEntry[]; pagination: any }>({
        queryKey: ['system-logs', params],
        queryFn: () => systemLogsApi.getLogs(params),
        staleTime: 5_000,
        refetchInterval: refetchInterval || false,
    });
};

export const useSystemLogMetrics = (refetchInterval?: number) => {
    return useQuery<SystemLogMetrics>({
        queryKey: ['system-logs-metrics'],
        queryFn: () => systemLogsApi.getMetrics(),
        staleTime: 10_000,
        refetchInterval: refetchInterval || false,
    });
};

export const useUpdateSystemLogStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            systemLogsApi.updateStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['system-logs'] });
            qc.invalidateQueries({ queryKey: ['system-logs-metrics'] });
        },
    });
};

export const useBatchUpdateSystemLogStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
            systemLogsApi.batchUpdateStatus(ids, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['system-logs'] });
            qc.invalidateQueries({ queryKey: ['system-logs-metrics'] });
        },
    });
};

export const useResolveSystemLogsByType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (params: { logId?: string; message?: string; status?: string; matchMode?: 'exact' | 'prefix' }) =>
            systemLogsApi.resolveByType(params),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['system-logs'] });
            qc.invalidateQueries({ queryKey: ['system-logs-metrics'] });
        },
    });
};

export const usePurgeSystemLogs = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (params: { olderThanDays?: number; status?: string }) =>
            systemLogsApi.purgeLogs(params),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['system-logs'] });
            qc.invalidateQueries({ queryKey: ['system-logs-metrics'] });
        },
    });
};
