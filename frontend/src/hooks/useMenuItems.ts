import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuItemApi } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
        onError: () => toast.error(t('toast.error')),
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
        onError: () => toast.error(t('toast.error')),
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
        onError: () => toast.error(t('toast.error')),
    });
};

export const useUploadMenuItemImage = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) => menuItemApi.uploadImage(id, file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['menu-items'] });
            toast.success(t('toast.uploaded'));
        },
        onError: () => toast.error(t('toast.error')),
    });
};
