import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import type { Category } from '../types';

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: categoryApi.list,
        staleTime: 30_000,
    });
};

export const useCreateCategory = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (data: object) => categoryApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['categories'] });
            toast.success(t('toast.created'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};

export const useUpdateCategory = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: object }) => categoryApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['categories'] });
            toast.success(t('toast.saved'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};

export const useDeleteCategory = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (id: string) => categoryApi.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['categories'] });
            toast.success(t('toast.deleted'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};

export const useReorderCategories = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (items: { id: string; displayOrder: number }[]) => categoryApi.reorder(items),
        onMutate: async (items) => {
            await qc.cancelQueries({ queryKey: ['categories'] });
            const previousCategories = qc.getQueryData<Category[]>(['categories']);
            if (previousCategories) {
                const orderMap = new Map(items.map(i => [i.id, i.displayOrder]));
                const updated = previousCategories
                    .map(c => (orderMap.has(c.id) ? { ...c, displayOrder: orderMap.get(c.id)! } : c))
                    .sort((a, b) => a.displayOrder - b.displayOrder);
                qc.setQueryData<Category[]>(['categories'], updated);
            }
            return { previousCategories };
        },
        onError: (error: any, _variables, context) => {
            if (context?.previousCategories) {
                qc.setQueryData(['categories'], context.previousCategories);
            }
            toast.error(error?.response?.data?.error || t('toast.error'));
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};
