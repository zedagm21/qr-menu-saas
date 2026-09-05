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
    price: z.number().positive('Price must be greater than 0'),
    discountPrice: z.number().positive('Discount price must be greater than 0').optional().nullable(),
    currency: z.string().min(2).max(4).optional().default('ETB'),
    imageUrl: z.string().optional().nullable(),
    isAvailable: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    isFasting: z.boolean().optional().default(true),
    displayOrder: z.number().int().min(0).optional(),
    translations: z.array(translationSchema).min(1, 'At least one translation required'),
}).refine((data) => {
    if (data.discountPrice !== undefined && data.discountPrice !== null) {
        return data.discountPrice < data.price;
    }
    return true;
}, {
    message: 'Discount price must be less than the regular price',
    path: ['discountPrice'],
});

export const updateMenuItemSchema = z.object({
    categoryId: z.string().optional(),
    price: z.number().positive('Price must be greater than 0').optional(),
    discountPrice: z.number().positive('Discount price must be greater than 0').optional().nullable(),
    currency: z.string().min(2).max(4).optional(),
    imageUrl: z.string().optional().nullable(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isFasting: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
    translations: z.array(translationSchema).optional(),
}).refine((data) => {
    if (data.discountPrice !== undefined && data.discountPrice !== null && data.price !== undefined) {
        return data.discountPrice < data.price;
    }
    return true;
}, {
    message: 'Discount price must be less than the regular price',
    path: ['discountPrice'],
});

export const reorderMenuItemsSchema = z.object({
    items: z.array(z.object({ id: z.string(), displayOrder: z.number().int().min(0) })),
});

export const batchUpdateMenuItemsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1, 'At least one item required'),
    data: z.object({
        isAvailable: z.boolean().optional(),
        categoryId: z.string().optional(),
        discountPercent: z.number().min(1).max(99).nullable().optional(),
    }),
});

export const batchDeleteMenuItemsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1, 'At least one item required'),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type BatchUpdateMenuItemsInput = z.infer<typeof batchUpdateMenuItemsSchema>;
export type BatchDeleteMenuItemsInput = z.infer<typeof batchDeleteMenuItemsSchema>;
