import { Request, Response, NextFunction } from 'express';
import { publicMenuService } from '../services/PublicMenuService';

export const getRestaurantPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const lang = (req.query.lang as 'EN' | 'AM') || 'EN';
        const restaurant = await publicMenuService.getRestaurantBySlug(req.params.slug, lang);
        res.json(restaurant);
    } catch (error) {
        next(error);
    }
};

export const getMenuPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const lang = (req.query.lang as 'EN' | 'AM') || 'EN';
        const menu = await publicMenuService.getMenuBySlug(req.params.slug, lang);
        res.json(menu);
    } catch (error) {
        next(error);
    }
};
