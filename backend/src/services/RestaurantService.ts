import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { imageStorage } from './ImageStorageService';
import { ImageProcessor } from './ImageProcessor';
import { publicMenuService } from './PublicMenuService';
import { TelegramBotService } from './TelegramBotService';
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

    isPlaceholderSlug(slug?: string | null, name?: string | null): boolean {
        if (!slug) return true;
        return /^my-restaurant(-\d+)?$/i.test(slug) || (name?.trim().toLowerCase() === 'my restaurant');
    }

    async updateRestaurant(restaurantId: string, data: UpdateRestaurantInput) {
        const existingRestaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { id: true, name: true, slug: true },
        });

        if (!existingRestaurant) {
            throw createError('Restaurant not found', 404);
        }

        const { translations, socialMedia, ...scalarData } = data;

        // Determine the primary name:
        const enName = translations?.find(t => t.language === 'EN')?.name?.trim();
        const amName = translations?.find(t => t.language === 'AM')?.name?.trim();
        const candidateName = enName || scalarData.name?.trim() || amName;

        let slugUpdate: { name?: string; slug?: string } = {};
        let isInitialActivation = false;
        if (candidateName) {
            slugUpdate.name = candidateName;

            // ONLY if currently unassigned or using an initial placeholder ('my-restaurant-*'),
            // transition cleanly to their first real restaurant name without creating an alias!
            if (!existingRestaurant.slug || this.isPlaceholderSlug(existingRestaurant.slug, existingRestaurant.name)) {
                if (candidateName.toLowerCase() !== 'my restaurant') {
                    const baseSlug = generateSlug(candidateName);
                    const cleanSlug = await ensureUniqueSlug(baseSlug, restaurantId);
                    slugUpdate.slug = cleanSlug;
                    isInitialActivation = true;
                }
            }
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

        // If newly activated with first real name and slug, alert administrators
        if (isInitialActivation && updated) {
            prisma.user.findFirst({
                where: { restaurantId },
                select: { email: true, name: true },
            }).then((owner) => {
                TelegramBotService.sendSignupAlert(
                    {
                        id: updated.id,
                        name: updated.name,
                        slug: updated.slug,
                        city: updated.city,
                    },
                    owner || undefined
                ).catch(() => {});
            }).catch(() => {});
        }

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

    async changeSlug(restaurantId: string, rawSlug: string) {
        const cleanSlug = generateSlug(rawSlug);
        if (!cleanSlug || cleanSlug.length < 2) {
            throw createError('Please provide a valid slug (at least 2 characters)', 400);
        }

        const existingRestaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { id: true, name: true, slug: true },
        });

        if (!existingRestaurant) {
            throw createError('Restaurant not found', 404);
        }

        if (existingRestaurant.slug === cleanSlug) {
            return existingRestaurant;
        }

        // Check if slug is taken by another restaurant
        const conflict = await prisma.restaurant.findUnique({
            where: { slug: cleanSlug },
            select: { id: true },
        });

        if (conflict && conflict.id !== restaurantId) {
            throw createError('This menu URL handle is already taken by another restaurant', 409);
        }

        // Check if slug is registered as an alias for another restaurant
        const aliasConflict = await prisma.restaurantSlugAlias.findUnique({
            where: { oldSlug: cleanSlug },
            select: { restaurantId: true },
        });

        if (aliasConflict && aliasConflict.restaurantId !== restaurantId) {
            throw createError('This menu URL handle was previously used and is reserved', 409);
        }

        const oldSlug = existingRestaurant.slug;
        const isPlaceholder = !oldSlug || this.isPlaceholderSlug(oldSlug, existingRestaurant.name);

        const updated = await prisma.$transaction(async (tx) => {
            // If the old slug was valid and NOT a placeholder, preserve it as an alias (max 3, FIFO discard)
            if (oldSlug && !isPlaceholder) {
                const existingAliases = await tx.restaurantSlugAlias.findMany({
                    where: { restaurantId },
                    orderBy: { createdAt: 'asc' },
                });

                // Filter out cleanSlug (which is becoming the new active slug) and oldSlug (to be updated/created)
                const otherAliases = existingAliases.filter(a => a.oldSlug !== cleanSlug && a.oldSlug !== oldSlug);

                // Enforce max 3 aliases: if adding oldSlug exceeds 3, delete the oldest alias(es)
                if (otherAliases.length >= 3) {
                    const discardCount = otherAliases.length - 3 + 1;
                    const toDiscard = otherAliases.slice(0, discardCount);
                    await tx.restaurantSlugAlias.deleteMany({
                        where: { id: { in: toDiscard.map(a => a.id) } },
                    });
                }

                await tx.restaurantSlugAlias.upsert({
                    where: { oldSlug },
                    update: { restaurantId, createdAt: new Date() },
                    create: { restaurantId, oldSlug },
                });
            }

            // Also delete any existing alias pointing this restaurant to cleanSlug (if it previously had it)
            await tx.restaurantSlugAlias.deleteMany({
                where: { oldSlug: cleanSlug, restaurantId },
            });

            return tx.restaurant.update({
                where: { id: restaurantId },
                data: { slug: cleanSlug },
                include: { translations: true, theme: true },
            });
        });

        // Invalidate cache for both old and new slugs
        if (oldSlug) {
            publicMenuService.invalidateCache(oldSlug).catch(() => {});
        }
        publicMenuService.invalidateCache(cleanSlug).catch(() => {});

        return updated;
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
