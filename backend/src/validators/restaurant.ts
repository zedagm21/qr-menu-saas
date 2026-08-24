import { z } from 'zod';

export const updateRestaurantSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    defaultLanguage: z.enum(['EN', 'AM']).optional(),
    currency: z.string().min(2).max(4).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export const updateThemeSchema = z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color').optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color').optional(),
    fontFamily: z.string().optional(),
    menuStyle: z.enum(['CLASSIC', 'MODERN', 'ELEGANT', 'MINIMAL']).optional(),
    darkMode: z.enum(['LIGHT', 'DARK', 'AUTO']).optional(),
});

export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
