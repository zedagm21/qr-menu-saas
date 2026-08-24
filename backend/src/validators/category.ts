import { z } from 'zod';

const translationSchema = z.object({
    language: z.enum(['EN', 'AM']),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});

export const createCategorySchema = z.object({
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    translations: z.array(translationSchema).min(1, 'At least one translation required'),
});

export const updateCategorySchema = z.object({
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    translations: z.array(translationSchema).optional(),
});

export const reorderCategoriesSchema = z.object({
    items: z.array(z.object({ id: z.string(), displayOrder: z.number().int().min(0) })),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
