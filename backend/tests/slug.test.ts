import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateSlug, transliterateAmharic } from '../src/utils/slug';
import { RestaurantService } from '../src/services/RestaurantService';

describe('Slug: Generation & Amharic Fidel Transliteration', () => {
    it('should generate clean lowercase hyphenated slugs from English text', () => {
        assert.strictEqual(generateSlug('Vista Cafe & Restaurant'), 'vista-cafe-restaurant');
        assert.strictEqual(generateSlug('  Special  Burger & Fries!  '), 'special-burger-fries');
        assert.strictEqual(generateSlug('Red Sea Bar & Grill 2026'), 'red-sea-bar-grill-2026');
    });

    it('should transliterate Amharic Fidel script into readable phonetic Latin slugs', () => {
        assert.strictEqual(generateSlug('ሮማ ካፌ'), 'roma-kafe');
        assert.strictEqual(generateSlug('ቴዎድሮስ ሬስቶራንት'), 'tewodros-restorant');
        assert.strictEqual(generateSlug('ቤተሰብ ባህላዊ ምግብ'), 'beteseb-bahlawi-mgb');
    });

    it('should cleanly handle mixed bilingual English and Amharic names', () => {
        const slug = generateSlug('ቦሌ Cafe');
        assert.strictEqual(slug, 'bole-cafe');
    });

    it('should collapse multiple hyphens and trim edge punctuation', () => {
        assert.strictEqual(generateSlug('---Hello----World---'), 'hello-world');
        assert.strictEqual(generateSlug('***Special*** Dish ***'), 'special-dish');
    });
});

describe('Slug: Placeholder Lifecycle & Aliases', () => {
    const restaurantService = new RestaurantService();

    it('should correctly identify initial onboarding placeholder slugs', () => {
        assert.strictEqual(restaurantService.isPlaceholderSlug(null), true);
        assert.strictEqual(restaurantService.isPlaceholderSlug(undefined), true);
        assert.strictEqual(restaurantService.isPlaceholderSlug(''), true);
        assert.strictEqual(restaurantService.isPlaceholderSlug('my-restaurant'), true);
        assert.strictEqual(restaurantService.isPlaceholderSlug('my-restaurant-1'), true);
        assert.strictEqual(restaurantService.isPlaceholderSlug('my-restaurant-94827'), true);
        assert.strictEqual(restaurantService.isPlaceholderSlug('my-restaurant', 'My Restaurant'), true);
    });

    it('should not flag real restaurant handles as placeholders', () => {
        assert.strictEqual(restaurantService.isPlaceholderSlug('vista-cafe-restaurant'), false);
        assert.strictEqual(restaurantService.isPlaceholderSlug('roma-kafe'), false);
        assert.strictEqual(restaurantService.isPlaceholderSlug('habesha-traditional-kitchen'), false);
        assert.strictEqual(restaurantService.isPlaceholderSlug('tewodros-restorant'), false);
    });
});

describe('Slug: Silent 3-Alias FIFO Discard & Availability', () => {
    const restaurantService = new RestaurantService();

    it('should enforce maximum of 3 aliases by discarding oldest when overflow occurs', async () => {
        const prisma = (await import('../src/config/database')).default;

        // Create temporary test restaurant
        const rest = await prisma.restaurant.create({
            data: {
                name: 'Test Alias Restaurant',
                slug: 'initial-handle-1',
            },
        });

        try {
            // Change handle 1 -> creates alias 'initial-handle-1' (count: 1)
            await restaurantService.changeSlug(rest.id, 'second-handle-2');
            let aliases = await prisma.restaurantSlugAlias.findMany({
                where: { restaurantId: rest.id },
                orderBy: { createdAt: 'asc' },
            });
            assert.strictEqual(aliases.length, 1);
            assert.strictEqual(aliases[0].oldSlug, 'initial-handle-1');

            // Change handle 2 -> creates alias 'second-handle-2' (count: 2)
            await restaurantService.changeSlug(rest.id, 'third-handle-3');
            aliases = await prisma.restaurantSlugAlias.findMany({
                where: { restaurantId: rest.id },
                orderBy: { createdAt: 'asc' },
            });
            assert.strictEqual(aliases.length, 2);

            // Change handle 3 -> creates alias 'third-handle-3' (count: 3 - max reached)
            await restaurantService.changeSlug(rest.id, 'fourth-handle-4');
            aliases = await prisma.restaurantSlugAlias.findMany({
                where: { restaurantId: rest.id },
                orderBy: { createdAt: 'asc' },
            });
            assert.strictEqual(aliases.length, 3);
            assert.strictEqual(aliases[0].oldSlug, 'initial-handle-1'); // Oldest

            // Change handle 4 -> overflow! 'initial-handle-1' must be discarded (FIFO)
            await restaurantService.changeSlug(rest.id, 'fifth-handle-5');
            aliases = await prisma.restaurantSlugAlias.findMany({
                where: { restaurantId: rest.id },
                orderBy: { createdAt: 'asc' },
            });
            assert.strictEqual(aliases.length, 3);
            // Verify 'initial-handle-1' was discarded
            assert.strictEqual(aliases.some(a => a.oldSlug === 'initial-handle-1'), false);
            // Verify aliases are now 2, 3, 4
            assert.strictEqual(aliases[0].oldSlug, 'second-handle-2');
            assert.strictEqual(aliases[1].oldSlug, 'third-handle-3');
            assert.strictEqual(aliases[2].oldSlug, 'fourth-handle-4');

            // Verify the discarded alias ('initial-handle-1') is now freed up for another restaurant to claim
            const anotherRest = await prisma.restaurant.create({
                data: {
                    name: 'Another Restaurant',
                    slug: 'temp-slug-xyz',
                },
            });

            try {
                // Claiming the discarded slug must succeed without 409 conflict
                const claimed = await restaurantService.changeSlug(anotherRest.id, 'initial-handle-1');
                assert.strictEqual(claimed.slug, 'initial-handle-1');
            } finally {
                await prisma.restaurant.delete({ where: { id: anotherRest.id } }).catch(() => {});
            }
        } finally {
            await prisma.restaurant.delete({ where: { id: rest.id } }).catch(() => {});
        }
    });
});

