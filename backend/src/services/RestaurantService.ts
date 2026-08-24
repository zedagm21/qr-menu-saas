import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { imageStorage } from './ImageStorageService';
import { ImageProcessor } from './ImageProcessor';
import type { UpdateRestaurantInput, UpdateThemeInput } from '../validators/restaurant';

export class RestaurantService {
    async getRestaurant(restaurantId: string) {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: { theme: true },
        });

        if (!restaurant) {
            throw createError('Restaurant not found', 404);
        }

        return restaurant;
    }

    async updateRestaurant(restaurantId: string, data: UpdateRestaurantInput) {
        return prisma.restaurant.update({
            where: { id: restaurantId },
            data,
            include: { theme: true },
        });
    }

    async updateLogo(restaurantId: string, file: Express.Multer.File, oldUrl?: string | null) {
        if (!file || !file.buffer) {
            throw createError('No image buffer provided', 400);
        }

        // 1. Validate magic bytes and process through Sharp (auto-rotate, resize, strip EXIF, convert to WebP)
        const processed = await ImageProcessor.processLogo(file.buffer);

        // 2. Save processed WebP buffer to storage
        const newUrl = await imageStorage.save(processed.buffer, 'webp');

        // 3. Persist new image URL to database
        try {
            const updated = await prisma.restaurant.update({
                where: { id: restaurantId },
                data: { logoUrl: newUrl },
                include: { theme: true },
            });

            // 4. Safely clean up old image if it existed and was different
            if (oldUrl && oldUrl !== newUrl) {
                imageStorage.delete(oldUrl).catch((err) => {
                    console.warn('[RestaurantService] Failed to clean up old logo:', err);
                });
            }

            return updated;
        } catch (dbError) {
            // Rollback: delete the newly created file if DB update fails
            await imageStorage.delete(newUrl);
            throw dbError;
        }
    }

    async updateCoverImage(restaurantId: string, file: Express.Multer.File, oldUrl?: string | null) {
        if (!file || !file.buffer) {
            throw createError('No image buffer provided', 400);
        }

        // 1. Validate magic bytes and process through Sharp (auto-rotate, resize, strip EXIF, convert to WebP)
        const processed = await ImageProcessor.processCover(file.buffer);

        // 2. Save processed WebP buffer to storage
        const newUrl = await imageStorage.save(processed.buffer, 'webp');

        // 3. Persist new image URL to database
        try {
            const updated = await prisma.restaurant.update({
                where: { id: restaurantId },
                data: { coverImageUrl: newUrl },
                include: { theme: true },
            });

            // 4. Safely clean up old image if it existed and was different
            if (oldUrl && oldUrl !== newUrl) {
                imageStorage.delete(oldUrl).catch((err) => {
                    console.warn('[RestaurantService] Failed to clean up old cover image:', err);
                });
            }

            return updated;
        } catch (dbError) {
            // Rollback: delete the newly created file if DB update fails
            await imageStorage.delete(newUrl);
            throw dbError;
        }
    }

    async updateTheme(restaurantId: string, data: UpdateThemeInput) {
        return prisma.restaurantTheme.upsert({
            where: { restaurantId },
            update: data,
            create: { restaurantId, ...data },
        });
    }

    async getStats(restaurantId: string) {
        const [itemCount, categoryCount, qrCode, restaurant] = await Promise.all([
            prisma.menuItem.count({ where: { restaurantId } }),
            prisma.category.count({ where: { restaurantId } }),
            prisma.qRCode.findFirst({ where: { restaurantId, isActive: true } }),
            prisma.restaurant.findUnique({
                where: { id: restaurantId },
                select: { status: true, name: true, theme: true, defaultLanguage: true },
            }),
        ]);

        return {
            itemCount,
            categoryCount,
            qrActive: !!qrCode,
            status: restaurant?.status,
            restaurantName: restaurant?.name,
            defaultLanguage: restaurant?.defaultLanguage,
            theme: restaurant?.theme,
        };
    }
}

export const restaurantService = new RestaurantService();
