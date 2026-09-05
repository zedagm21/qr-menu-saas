import { Request, Response, NextFunction } from 'express';
import { menuItemService } from '../services/MenuItemService';
import {
    createMenuItemSchema,
    updateMenuItemSchema,
    reorderMenuItemsSchema,
    batchUpdateMenuItemsSchema,
    batchDeleteMenuItemsSchema,
} from '../validators/menuItem';

export const getMenuItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categoryId = req.query.categoryId as string | undefined;
        const items = await menuItemService.getMenuItems(req.user!.restaurantId!, categoryId);
        res.json(items);
    } catch (error) {
        next(error);
    }
};

export const getMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const item = await menuItemService.getMenuItem(req.user!.restaurantId!, req.params.id);
        res.json(item);
    } catch (error) {
        next(error);
    }
};

export const createMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = createMenuItemSchema.parse(req.body);
        const item = await menuItemService.createMenuItem(req.user!.restaurantId!, data);
        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
};

export const updateMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = updateMenuItemSchema.parse(req.body);
        const item = await menuItemService.updateMenuItem(req.user!.restaurantId!, req.params.id, data);
        res.json(item);
    } catch (error) {
        next(error);
    }
};

export const deleteMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await menuItemService.deleteMenuItem(req.user!.restaurantId!, req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const uploadMenuItemImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const item = await menuItemService.uploadImage(req.user!.restaurantId!, req.params.id, req.file);
        res.json(item);
    } catch (error) {
        next(error);
    }
};

export const reorderMenuItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = reorderMenuItemsSchema.parse(req.body);
        await menuItemService.reorderMenuItems(req.user!.restaurantId!, data.items);
        res.json({ message: 'Items reordered' });
    } catch (error) {
        next(error);
    }
};

export const batchUpdateMenuItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { ids, data } = batchUpdateMenuItemsSchema.parse(req.body);
        const result = await menuItemService.batchUpdateMenuItems(req.user!.restaurantId!, ids, data);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const batchDeleteMenuItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { ids } = batchDeleteMenuItemsSchema.parse(req.body);
        const result = await menuItemService.batchDeleteMenuItems(req.user!.restaurantId!, ids);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
