import { describe, it } from 'node:test';
import assert from 'node:assert';
import { batchUpdateMenuItemsSchema, batchDeleteMenuItemsSchema } from '../src/validators/menuItem';

describe('Menu: Batch Operations Validation & Calculations', () => {
    it('should validate correct batch availability update payloads', () => {
        const payload = {
            ids: ['uuid-1', 'uuid-2'],
            data: { isAvailable: false }
        };
        const parsed = batchUpdateMenuItemsSchema.parse(payload);
        assert.deepStrictEqual(parsed.ids, ['uuid-1', 'uuid-2']);
        assert.strictEqual(parsed.data.isAvailable, false);
    });

    it('should validate valid batch discount percent payloads', () => {
        const payload = {
            ids: ['uuid-1'],
            data: { discountPercent: 25 }
        };
        const parsed = batchUpdateMenuItemsSchema.parse(payload);
        assert.strictEqual(parsed.data.discountPercent, 25);
    });

    it('should reject batch update with empty ids array', () => {
        assert.throws(() => {
            batchUpdateMenuItemsSchema.parse({
                ids: [],
                data: { isAvailable: true }
            });
        });
    });

    it('should reject invalid discount percentages (< 0 or > 100)', () => {
        assert.throws(() => {
            batchUpdateMenuItemsSchema.parse({
                ids: ['uuid-1'],
                data: { discountPercent: -10 }
            });
        });

        assert.throws(() => {
            batchUpdateMenuItemsSchema.parse({
                ids: ['uuid-1'],
                data: { discountPercent: 120 }
            });
        });
    });

    it('should reject batch update with empty data object', () => {
        assert.throws(() => {
            batchUpdateMenuItemsSchema.parse({
                ids: ['uuid-1'],
                data: {}
            });
        });
    });

    it('should validate correct batch delete payloads', () => {
        const payload = { ids: ['item-1', 'item-2', 'item-3'] };
        const parsed = batchDeleteMenuItemsSchema.parse(payload);
        assert.strictEqual(parsed.ids.length, 3);
    });

    it('should reject batch delete with empty ids', () => {
        assert.throws(() => {
            batchDeleteMenuItemsSchema.parse({ ids: [] });
        });
    });

    it('should accurately calculate percentage discount prices', () => {
        const calculateDiscount = (price: number, percent: number): number => {
            const factor = (100 - percent) / 100;
            return Math.round(price * factor * 100) / 100;
        };

        assert.strictEqual(calculateDiscount(100, 15), 85);
        assert.strictEqual(calculateDiscount(250, 20), 200);
        assert.strictEqual(calculateDiscount(500, 50), 250);
        assert.strictEqual(calculateDiscount(80, 10), 72);
    });
});
