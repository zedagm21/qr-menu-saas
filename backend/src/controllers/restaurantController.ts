import { Request, Response, NextFunction } from 'express';
import { restaurantService } from '../services/RestaurantService';
import { updateRestaurantSchema, updateThemeSchema } from '../validators/restaurant';
import prisma from '../config/database';

export const getRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const restaurant = await restaurantService.getRestaurant(req.user!.restaurantId!);
        res.json(restaurant);
    } catch (error) {
        next(error);
    }
};

export const updateRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = updateRestaurantSchema.parse(req.body);
        const restaurant = await restaurantService.updateRestaurant(req.user!.restaurantId!, data);
        res.json(restaurant);
    } catch (error) {
        next(error);
    }
};

export const updateLogo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const current = await restaurantService.getRestaurant(req.user!.restaurantId!);
        const restaurant = await restaurantService.updateLogo(req.user!.restaurantId!, req.file, current.logoUrl);
        res.json(restaurant);
    } catch (error) {
        next(error);
    }
};

export const updateCoverImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const current = await restaurantService.getRestaurant(req.user!.restaurantId!);
        const restaurant = await restaurantService.updateCoverImage(req.user!.restaurantId!, req.file, current.coverImageUrl);
        res.json(restaurant);
    } catch (error) {
        next(error);
    }
};

export const updateTheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = updateThemeSchema.parse(req.body);
        const theme = await restaurantService.updateTheme(req.user!.restaurantId!, data);
        res.json(theme);
    } catch (error) {
        next(error);
    }
};

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const stats = await restaurantService.getStats(req.user!.restaurantId!);
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

export const publishMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Fetch current status then toggle with a single DB write
        const current = await restaurantService.getRestaurant(req.user!.restaurantId!);
        const newStatus = current.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        const result = await prisma.restaurant.update({
            where: { id: req.user!.restaurantId! },
            data: { status: newStatus },
            include: { theme: true },
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};
