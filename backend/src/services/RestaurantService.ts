import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { imageStorage } from './ImageStorageService';
import { ImageProcessor } from './ImageProcessor';
import { publicMenuService } from './PublicMenuService';
import { generateSlug, ensureUniqueSlug } from '../utils/slug';
import type { UpdateRestaurantInput, UpdateThemeInput } from '../validators/restaurant';

export class RestaurantService {
    async getRestaurant(restaurantId: string) {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: { translations: true, theme: true },
        });

        if (!restaurant) {
            throw createError('Restaurant not found', 404);
        }

        return restaurant;
    }

    async updateRestaurant(restaurantId: string, data: UpdateRestaurantInput) {
        const { translations, socialMedia, ...scalarData } = data;

        // Determine the primary name for slug generation:
        // Priority 1: English name from translations or scalarData.name
        // Priority 2: Amharic name from translations (will be phonetically transliterated into Latin)
        const enName = translations?.find(t => t.language === 'EN')?.name?.trim();
        const amName = translations?.find(t => t.language === 'AM')?.name?.trim();
        const candidateName = enName || scalarData.name?.trim() || amName;

        let slugUpdate: { name?: string; slug?: string } = {};
        if (candidateName) {
            const baseSlug = generateSlug(candidateName);
            const slug = await ensureUniqueSlug(baseSlug, restaurantId);
            slugUpdate = {
                name: candidateName,
                slug,
            };
        }

        const updated = await prisma.$transaction(async (tx) => {
            await tx.restaurant.update({
                where: { id: restaurantId },
                data: {
                    ...scalarData,
                    ...slugUpdate,
                    socialMedia: socialMedia === null ? Prisma.JsonNull : (socialMedia ?? undefined),
                },
            });

            if (translations && translations.length > 0) {
                for (const translation of translations) {
                    await tx.restaurantTranslation.upsert({
                        where: {
                            restaurantId_language: {
                                restaurantId,
                                language: translation.language,
                            },
                        },
                        update: {
                            name: translation.name,
                            description: translation.description,
                            address: translation.address,
                            city: translation.city,
                        },
                        create: {
                            restaurantId,
                            language: translation.language,
                            name: translation.name,
                            description: translation.description,
                            address: translation.address,
                            city: translation.city,
                        },
                    });
                }
            }

            return tx.restaurant.findUnique({
                where: { id: restaurantId },
                include: { translations: true, theme: true },
            });
        });
        publicMenuService.invalidateCache(restaurantId).catch(() => {});
        return updated;
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
                include: { translations: true, theme: true },
            });

            // 4. Safely clean up old image if it existed and was different
            if (oldUrl && oldUrl !== newUrl) {
                imageStorage.delete(oldUrl).catch((err) => {
                    console.warn('[RestaurantService] Failed to clean up old logo:', err);
                });
            }

            publicMenuService.invalidateCache(restaurantId).catch(() => {});
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
                include: { translations: true, theme: true },
            });

            // 4. Safely clean up old image if it existed and was different
            if (oldUrl && oldUrl !== newUrl) {
                imageStorage.delete(oldUrl).catch((err) => {
                    console.warn('[RestaurantService] Failed to clean up old cover image:', err);
                });
            }

            publicMenuService.invalidateCache(restaurantId).catch(() => {});
            return updated;
        } catch (dbError) {
            // Rollback: delete the newly created file if DB update fails
            await imageStorage.delete(newUrl);
            throw dbError;
        }
    }

    async updateTheme(restaurantId: string, data: UpdateThemeInput) {
        const theme = await prisma.restaurantTheme.upsert({
            where: { restaurantId },
            update: data,
            create: { restaurantId, ...data },
        });
        publicMenuService.invalidateCache(restaurantId).catch(() => {});
        return theme;
    }

    async getStats(restaurantId: string) {
        const [itemCount, categoryCount, qrCode, restaurant] = await Promise.all([
            prisma.menuItem.count({ where: { restaurantId } }),
            prisma.category.count({ where: { restaurantId } }),
            prisma.qRCode.findFirst({ where: { restaurantId, isActive: true } }),
            prisma.restaurant.findUnique({
                where: { id: restaurantId },
                include: { translations: true, theme: true },
            }),
        ]);

        return {
            itemCount,
            categoryCount,
            qrActive: !!qrCode,
            status: restaurant?.status,
            restaurantName: restaurant?.name,
            translations: restaurant?.translations,
            defaultLanguage: restaurant?.defaultLanguage,
            theme: restaurant?.theme,
        };
    }
}

export const restaurantService = new RestaurantService();
