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
