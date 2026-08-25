import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
        onError: (err: any) => toast.error(err?.response?.data?.error || t('toast.error')),
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
        onError: (err: any) => toast.error(err?.response?.data?.error || t('toast.error')),
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
        onError: (err: any) => toast.error(err?.response?.data?.error || t('toast.error')),
    });
};

export const useReorderCategories = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (items: { id: string; displayOrder: number }[]) => categoryApi.reorder(items),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
        onError: (err: any) => toast.error(err?.response?.data?.error || t('toast.error')),
    });
};
