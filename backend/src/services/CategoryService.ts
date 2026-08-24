import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import type { CreateCategoryInput, UpdateCategoryInput } from '../validators/category';

export class CategoryService {
    async getCategories(restaurantId: string) {
        return prisma.category.findMany({
            where: { restaurantId },
            include: { translations: true },
            orderBy: { displayOrder: 'asc' },
        });
    }

    async createCategory(restaurantId: string, data: CreateCategoryInput) {
        return prisma.category.create({
            data: {
                restaurantId,
                displayOrder: data.displayOrder ?? 0,
                isActive: data.isActive ?? true,
                translations: {
                    create: data.translations,
                },
            },
            include: { translations: true },
        });
    }

    async updateCategory(restaurantId: string, categoryId: string, data: UpdateCategoryInput) {
        await this.assertOwnership(restaurantId, categoryId);

        return prisma.$transaction(async (tx) => {
            await tx.category.update({
                where: { id: categoryId },
                data: {
                    displayOrder: data.displayOrder,
                    isActive: data.isActive,
                },
            });

            if (data.translations && data.translations.length > 0) {
                for (const translation of data.translations) {
                    await tx.categoryTranslation.upsert({
                        where: { categoryId_language: { categoryId, language: translation.language } },
                        update: { name: translation.name, description: translation.description },
                        create: { categoryId, ...translation },
                    });
                }
            }

            return tx.category.findUnique({
                where: { id: categoryId },
                include: { translations: true },
            });
        });
    }

    async deleteCategory(restaurantId: string, categoryId: string) {
        await this.assertOwnership(restaurantId, categoryId);

        const itemCount = await prisma.menuItem.count({ where: { categoryId } });
        if (itemCount > 0) {
            throw createError('Cannot delete category with menu items. Move or delete items first.', 400);
        }

        return prisma.category.delete({ where: { id: categoryId } });
    }

    async reorderCategories(restaurantId: string, items: { id: string; displayOrder: number }[]) {
        // Verify all categories belong to this restaurant
        const ids = items.map((i) => i.id);
        const categories = await prisma.category.findMany({
            where: { id: { in: ids }, restaurantId },
        });

        if (categories.length !== ids.length) {
            throw createError('One or more categories do not belong to this restaurant', 403);
        }

        await prisma.$transaction(
            items.map((item) =>
                prisma.category.update({
                    where: { id: item.id },
                    data: { displayOrder: item.displayOrder },
                })
            )
        );
    }

    private async assertOwnership(restaurantId: string, categoryId: string) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category || category.restaurantId !== restaurantId) {
            throw createError('Category not found', 404);
        }
        return category;
    }
}

export const categoryService = new CategoryService();
