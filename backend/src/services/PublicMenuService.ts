import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';

export class PublicMenuService {
    async getRestaurantBySlug(slug: string) {
        const restaurant = await prisma.restaurant.findUnique({
            where: { slug },
            include: { theme: true },
        });

        if (!restaurant) {
            throw createError('Restaurant not found', 404);
        }

        if (restaurant.status !== 'PUBLISHED') {
            throw createError('This menu is currently unavailable', 404);
        }

        // Return only public-safe fields (no internal IDs needed by customers)
        return {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            description: restaurant.description,
            logoUrl: restaurant.logoUrl,
            coverImageUrl: restaurant.coverImageUrl,
            phone: restaurant.phone,
            email: restaurant.email,
            address: restaurant.address,
            city: restaurant.city,
            country: restaurant.country,
            defaultLanguage: restaurant.defaultLanguage,
            currency: restaurant.currency,
            theme: restaurant.theme,
        };
    }

    async getMenuBySlug(slug: string, lang: 'EN' | 'AM' = 'EN') {
        const restaurant = await prisma.restaurant.findUnique({
            where: { slug },
            select: { id: true, status: true, currency: true },
        });

        if (!restaurant) {
            throw createError('Restaurant not found', 404);
        }

        if (restaurant.status !== 'PUBLISHED') {
            throw createError('This menu is currently unavailable', 404);
        }

        const categories = await prisma.category.findMany({
            where: { restaurantId: restaurant.id, isActive: true },
            include: {
                translations: true,
                menuItems: {
                    where: { restaurantId: restaurant.id },
                    include: { translations: true },
                    orderBy: { displayOrder: 'asc' },
                },
            },
            orderBy: { displayOrder: 'asc' },
        });

        // Project to bilingual-aware structure with fallback to EN
        return categories.map((category) => {
            const catTranslation =
                category.translations.find((t) => t.language === lang) ||
                category.translations.find((t) => t.language === 'EN');

            return {
                id: category.id,
                name: catTranslation?.name ?? 'Unnamed',
                description: catTranslation?.description ?? null,
                displayOrder: category.displayOrder,
                menuItems: category.menuItems.map((item) => {
                    const itemTranslation =
                        item.translations.find((t) => t.language === lang) ||
                        item.translations.find((t) => t.language === 'EN');

                    return {
                        id: item.id,
                        name: itemTranslation?.name ?? 'Unnamed',
                        description: itemTranslation?.description ?? null,
                        price: item.price.toString(),
                        currency: item.currency,
                        imageUrl: item.imageUrl,
                        isAvailable: item.isAvailable, // Always returned — customers see "unavailable" label
                        isFeatured: item.isFeatured,
                        isSpicy: item.isSpicy,
                        displayOrder: item.displayOrder,
                        ingredients: itemTranslation?.ingredients ?? null,
                        allergens: itemTranslation?.allergens ?? null,
                    };
                }),
            };
        });
    }
}

export const publicMenuService = new PublicMenuService();
