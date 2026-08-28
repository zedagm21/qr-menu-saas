import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { publicMenuCache } from './PublicMenuCache';

export class PublicMenuService {
    /**
     * Invalidate all cached data for a given restaurant by its slug or ID
     */
    async invalidateCache(slugOrRestaurantId: string): Promise<void> {
        let slug = slugOrRestaurantId;
        // If an ID was provided, resolve the slug
        if (slugOrRestaurantId.length > 20) {
            const r = await prisma.restaurant.findUnique({
                where: { id: slugOrRestaurantId },
                select: { slug: true },
            });
            if (r?.slug) slug = r.slug;
        }

        publicMenuCache.invalidatePrefix(`restaurant:${slug}`);
        publicMenuCache.invalidatePrefix(`menu:${slug}`);
    }

    async getRestaurantBySlug(slug: string, lang: 'EN' | 'AM' = 'EN') {
        const cacheKey = `restaurant:${slug}:${lang}`;
        const cached = publicMenuCache.get(cacheKey);
        if (cached) return cached;
        const restaurant = await prisma.restaurant.findUnique({
            where: { slug },
            include: { translations: true, theme: true },
        });

        if (!restaurant) {
            throw createError('Restaurant not found', 404);
        }

        if (restaurant.isSuspended) {
            throw createError('This menu is currently unavailable', 403, {
                isSuspended: true,
            });
        }

        if (restaurant.status !== 'PUBLISHED') {
            throw createError('This menu is currently unavailable', 404);
        }

        // Project to bilingual-aware structure with fallback to EN then scalar fields
        const translation =
            restaurant.translations.find((t) => t.language === lang) ||
            restaurant.translations.find((t) => t.language === 'EN');

        // Return only public-safe fields (no internal IDs needed by customers)
        const result = {
            id: restaurant.id,
            name: translation?.name || restaurant.name,
            slug: restaurant.slug,
            description: translation?.description ?? restaurant.description,
            logoUrl: restaurant.logoUrl,
            coverImageUrl: restaurant.coverImageUrl,
            phone: restaurant.phone,
            email: restaurant.email,
            address: translation?.address ?? restaurant.address,
            city: translation?.city ?? restaurant.city,
            country: restaurant.country,
            defaultLanguage: restaurant.defaultLanguage,
            currency: restaurant.currency,
            wifiName: restaurant.wifiName,
            wifiPassword: restaurant.wifiPassword,
            paymentInfo: restaurant.paymentInfo,
            socialMedia: restaurant.socialMedia,
            theme: restaurant.theme,
            translations: restaurant.translations,
        };

        publicMenuCache.set(cacheKey, result);
        return result;
    }

    async getMenuBySlug(slug: string, lang: 'EN' | 'AM' = 'EN') {
        const cacheKey = `menu:${slug}:${lang}`;
        const cached = publicMenuCache.get(cacheKey);
        if (cached) return cached;

        const restaurant = await prisma.restaurant.findUnique({
            where: { slug },
            select: { id: true, status: true, currency: true, isSuspended: true, suspensionReason: true },
        });

        if (!restaurant) {
            throw createError('Restaurant not found', 404);
        }

        if (restaurant.isSuspended) {
            throw createError('This menu is currently unavailable', 403, {
                isSuspended: true,
            });
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
        const result = categories.map((category) => {
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
                        discountPrice: item.discountPrice ? item.discountPrice.toString() : null,
                        currency: item.currency,
                        imageUrl: item.imageUrl,
                        isAvailable: item.isAvailable, // Always returned — customers see "unavailable" label
                        isFeatured: item.isFeatured,
                        isFasting: item.isFasting,
                        displayOrder: item.displayOrder,
                        ingredients: itemTranslation?.ingredients ?? null,
                        allergens: itemTranslation?.allergens ?? null,
                    };
                }),
            };
        });

        publicMenuCache.set(cacheKey, result);
        return result;
    }
}

export const publicMenuService = new PublicMenuService();

