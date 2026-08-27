import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import type { AnalyticsData } from '../types';

export const useAnalytics = (timeframe: string = '7d') => {
    return useQuery<AnalyticsData>({
        queryKey: ['restaurant-analytics', timeframe],
        queryFn: () => analyticsApi.get(timeframe),
        staleTime: 30_000, // 30 seconds
    });
};
