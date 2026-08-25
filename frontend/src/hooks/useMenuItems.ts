import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuItemApi } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '../types';

export const useMenuItems = (categoryId?: string) => {
    return useQuery({
        queryKey: ['menu-items', categoryId],
        queryFn: () => menuItemApi.list(categoryId),
        staleTime: 30_000,
    });
};

export const useMenuItem = (id: string) => {
    return useQuery({
        queryKey: ['menu-items', id],
        queryFn: () => menuItemApi.get(id),
        enabled: !!id,
    });
};

export const useCreateMenuItem = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (data: object) => menuItemApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['menu-items'] });
            toast.success(t('toast.created'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};

export const useUpdateMenuItem = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: object }) => menuItemApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['menu-items'] });
            toast.success(t('toast.saved'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};

export const useToggleItemAvailability = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
            menuItemApi.update(id, { isAvailable }),

        // Optimistic update: flip UI immediately
        onMutate: async ({ id, isAvailable }) => {
            await qc.cancelQueries({ queryKey: ['menu-items'] });

            const previousItems = qc.getQueryData<MenuItem[]>(['menu-items']);

            if (previousItems) {
                qc.setQueryData<MenuItem[]>(['menu-items'], (old = []) =>
                    old.map((item) => (item.id === id ? { ...item, isAvailable } : item))
                );
            }

            return { previousItems };
        },

        // Rollback on network failure
        onError: (error: any, _variables, context) => {
            if (context?.previousItems) {
                qc.setQueryData(['menu-items'], context.previousItems);
            }
            toast.error(error?.response?.data?.error || t('toast.error'));
        },

        // Always sync with server state
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['menu-items'] });
        },
    });
};

export const useDeleteMenuItem = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (id: string) => menuItemApi.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['menu-items'] });
            toast.success(t('toast.deleted'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};

export const useUploadMenuItemImage = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: ({ id, file, onProgress }: { id: string; file: File; onProgress?: (percent: number) => void }) =>
            menuItemApi.uploadImage(id, file, onProgress),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['menu-items'] });
            toast.success(t('toast.uploaded'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};
