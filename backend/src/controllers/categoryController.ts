import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/CategoryService';
import { createCategorySchema, updateCategorySchema, reorderCategoriesSchema } from '../validators/category';

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categories = await categoryService.getCategories(req.user!.restaurantId!);
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = createCategorySchema.parse(req.body);
        const category = await categoryService.createCategory(req.user!.restaurantId!, data);
        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = updateCategorySchema.parse(req.body);
        const category = await categoryService.updateCategory(req.user!.restaurantId!, req.params.id, data);
        res.json(category);
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await categoryService.deleteCategory(req.user!.restaurantId!, req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const reorderCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = reorderCategoriesSchema.parse(req.body);
        await categoryService.reorderCategories(req.user!.restaurantId!, data.items);
        res.json({ message: 'Categories reordered' });
    } catch (error) {
        next(error);
    }
};
