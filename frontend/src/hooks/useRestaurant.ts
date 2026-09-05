import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantApi } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useRestaurant = () => {
    return useQuery({
        queryKey: ['restaurant'],
        queryFn: restaurantApi.get,
        staleTime: 30_000,
    });
};

export const useUpdateRestaurant = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (data: object) => restaurantApi.update(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['restaurant'] });
            toast.success(t('toast.saved'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};

export const useChangeSlug = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (slug: string) => restaurantApi.changeSlug(slug),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['restaurant'] });
            qc.invalidateQueries({ queryKey: ['qr-codes'] });
            qc.invalidateQueries({ queryKey: ['restaurant', 'stats'] });
            qc.invalidateQueries({ queryKey: ['public-restaurant'] });
            qc.invalidateQueries({ queryKey: ['public-menu'] });
            toast.success(t('restaurant.slug_updated', { defaultValue: 'Menu URL handle updated successfully!' }));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};

export const useUpdateTheme = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (data: object) => restaurantApi.updateTheme(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['restaurant'] });
            qc.invalidateQueries({ queryKey: ['public-restaurant'] });
            qc.invalidateQueries({ queryKey: ['public-menu'] });
            toast.success(t('toast.saved'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('toast.error')),
    });
};

export const useRestaurantStats = () => {
    return useQuery({
        queryKey: ['restaurant', 'stats'],
        queryFn: restaurantApi.getStats,
        staleTime: 60_000,
    });
};
