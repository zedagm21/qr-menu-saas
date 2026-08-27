import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/AnalyticsService';

export const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const restaurantId = req.user!.restaurantId!;
        const timeframe = (req.query.timeframe as string) || (req.query.range as string) || '7d';
        const data = await analyticsService.getRestaurantAnalytics(restaurantId, timeframe);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

export const exportAnalyticsCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const restaurantId = req.user!.restaurantId!;
        const timeframe = (req.query.timeframe as string) || (req.query.range as string) || '30d';
        const csv = await analyticsService.generateCsv(restaurantId, timeframe);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="restaurant-analytics-${timeframe}.csv"`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
};
