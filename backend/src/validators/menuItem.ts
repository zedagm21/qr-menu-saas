import { z } from 'zod';

const translationSchema = z.object({
    language: z.enum(['EN', 'AM']),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    ingredients: z.string().optional(),
    allergens: z.string().optional(),
});

export const createMenuItemSchema = z.object({
    categoryId: z.string().min(1, 'Category is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    currency: z.string().min(2).max(4).optional().default('ETB'),
    isAvailable: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    isSpicy: z.boolean().optional().default(false),
    displayOrder: z.number().int().min(0).optional(),
    translations: z.array(translationSchema).min(1, 'At least one translation required'),
});

export const updateMenuItemSchema = z.object({
    categoryId: z.string().optional(),
    price: z.number().min(0).optional(),
    currency: z.string().min(2).max(4).optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isSpicy: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
    translations: z.array(translationSchema).optional(),
});

export const reorderMenuItemsSchema = z.object({
    items: z.array(z.object({ id: z.string(), displayOrder: z.number().int().min(0) })),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
