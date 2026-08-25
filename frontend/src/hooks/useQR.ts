import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qrApi } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useQRCodes = () => {
    return useQuery({
        queryKey: ['qr-codes'],
        queryFn: qrApi.list,
        staleTime: 60_000,
    });
};

export const useEnsureQRCode = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: qrApi.ensure,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['qr-codes'] });
            toast.success(t('toast.qrGenerated'));
        },
        onError: (err: any) => toast.error(err?.response?.data?.error || t('toast.error')),
    });
};

export const useDeleteQRCode = () => {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (id: string) => qrApi.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['qr-codes'] });
            toast.success(t('toast.deleted'));
        },
        onError: (err: any) => toast.error(err?.response?.data?.error || t('toast.error')),
    });
};
