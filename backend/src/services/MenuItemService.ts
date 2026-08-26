import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { imageStorage } from './ImageStorageService';
import { ImageProcessor } from './ImageProcessor';
import { publicMenuService } from './PublicMenuService';
import type { CreateMenuItemInput, UpdateMenuItemInput } from '../validators/menuItem';
import { Decimal } from '@prisma/client/runtime/library';

export class MenuItemService {
    async getMenuItems(restaurantId: string, categoryId?: string) {
        return prisma.menuItem.findMany({
            where: { restaurantId, ...(categoryId ? { categoryId } : {}) },
            include: { translations: true, category: { include: { translations: true } } },
            orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
        });
    }

    async getMenuItem(restaurantId: string, itemId: string) {
        const item = await prisma.menuItem.findUnique({
            where: { id: itemId },
            include: { translations: true, category: { include: { translations: true } } },
        });

        if (!item || item.restaurantId !== restaurantId) {
            throw createError('Menu item not found', 404);
        }

        return item;
    }

    async createMenuItem(restaurantId: string, data: CreateMenuItemInput) {
        // Verify category belongs to restaurant
        const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
        if (!category || category.restaurantId !== restaurantId) {
            throw createError('Category not found', 404);
        }

        const item = await prisma.menuItem.create({
            data: {
                restaurantId,
                categoryId: data.categoryId,
                price: new Decimal(data.price),
                discountPrice: data.discountPrice !== undefined && data.discountPrice !== null ? new Decimal(data.discountPrice) : null,
                currency: data.currency ?? 'ETB',
                imageUrl: data.imageUrl ?? null,
                isAvailable: data.isAvailable ?? true,
                isFeatured: data.isFeatured ?? false,
                isSpicy: data.isSpicy ?? false,
                displayOrder: data.displayOrder ?? 0,
                translations: {
                    create: data.translations,
                },
            },
            include: { translations: true },
        });

        publicMenuService.invalidateCache(restaurantId).catch(() => {});
        return item;
    }

    async updateMenuItem(restaurantId: string, itemId: string, data: UpdateMenuItemInput) {
        await this.assertOwnership(restaurantId, itemId);

        if (data.categoryId) {
            const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
            if (!category || category.restaurantId !== restaurantId) {
                throw createError('Category not found', 404);
            }
        }

        const updated = await prisma.$transaction(async (tx) => {
            await tx.menuItem.update({
                where: { id: itemId },
                data: {
                    ...(data.categoryId && { categoryId: data.categoryId }),
                    ...(data.price !== undefined && { price: new Decimal(data.price) }),
                    ...(data.discountPrice !== undefined && { discountPrice: data.discountPrice !== null ? new Decimal(data.discountPrice) : null }),
                    ...(data.currency && { currency: data.currency }),
                    ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
                    ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
                    ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
                    ...(data.isSpicy !== undefined && { isSpicy: data.isSpicy }),
                    ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
                },
            });

            if (data.translations && data.translations.length > 0) {
                for (const translation of data.translations) {
                    await tx.menuItemTranslation.upsert({
                        where: { menuItemId_language: { menuItemId: itemId, language: translation.language } },
                        update: { name: translation.name, description: translation.description, ingredients: translation.ingredients, allergens: translation.allergens },
                        create: { menuItemId: itemId, ...translation },
                    });
                }
            }

            return tx.menuItem.findUnique({
                where: { id: itemId },
                include: { translations: true },
            });
        });

        publicMenuService.invalidateCache(restaurantId).catch(() => {});
        return updated;
    }

    async deleteMenuItem(restaurantId: string, itemId: string) {
        const item = await this.assertOwnership(restaurantId, itemId);

        // Delete from database first
        const deleted = await prisma.menuItem.delete({ where: { id: itemId } });

        // Clean up image file only after successful database deletion
        if (item.imageUrl) {
            imageStorage.delete(item.imageUrl).catch((err) => {
                console.warn('[MenuItemService] Failed to clean up item image on delete:', err);
            });
        }

        publicMenuService.invalidateCache(restaurantId).catch(() => {});
        return deleted;
    }

    async uploadImage(restaurantId: string, itemId: string, file: Express.Multer.File) {
        const item = await this.assertOwnership(restaurantId, itemId);

        if (!file || !file.buffer) {
            throw createError('No image buffer provided', 400);
        }

        // 1. Validate magic bytes and process with Sharp (auto-rotate, resize, strip metadata, convert to WebP)
        const processed = await ImageProcessor.processMenuItem(file.buffer);

        // 2. Save processed WebP buffer to storage
        const newUrl = await imageStorage.save(processed.buffer, 'webp');

        // 3. Persist new image URL to database
        try {
            const updated = await prisma.menuItem.update({
                where: { id: itemId },
                data: { imageUrl: newUrl },
                include: { translations: true },
            });

            // 4. Safely clean up old image if it existed and was different
            if (item.imageUrl && item.imageUrl !== newUrl) {
                imageStorage.delete(item.imageUrl).catch((err) => {
                    console.warn('[MenuItemService] Failed to clean up old item image:', err);
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

    async reorderMenuItems(restaurantId: string, items: { id: string; displayOrder: number }[]) {
        const ids = items.map((i) => i.id);
        const dbItems = await prisma.menuItem.findMany({
            where: { id: { in: ids }, restaurantId },
        });

        if (dbItems.length !== ids.length) {
            throw createError('One or more items do not belong to this restaurant', 403);
        }

        await prisma.$transaction(
            items.map((item) =>
                prisma.menuItem.update({
                    where: { id: item.id },
                    data: { displayOrder: item.displayOrder },
                })
            )
        );

        publicMenuService.invalidateCache(restaurantId).catch(() => {});
    }

    private async assertOwnership(restaurantId: string, itemId: string) {
        const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
        if (!item || item.restaurantId !== restaurantId) {
            throw createError('Menu item not found', 404);
        }
        return item;
    }
}

export const menuItemService = new MenuItemService();
