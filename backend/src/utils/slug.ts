import prisma from '../config/database';

/**
 * Generates a URL-safe slug from a string.
 * Ensures uniqueness by appending a number if slug already exists.
 */
export const generateSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await prisma.restaurant.findUnique({ where: { slug } });
        if (!existing || existing.id === excludeId) {
            return slug;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
};
