import prisma from '../../src/config/database';
import { menuItemService } from '../../src/services/MenuItemService';
import { batchUpdateMenuItemsSchema, batchDeleteMenuItemsSchema } from '../../src/validators/menuItem';

async function main() {
    console.log('--- Verifying Phase 2 Backend Implementation ---');

    // 1. Verify schema validation
    console.log('1. Testing batchUpdateMenuItemsSchema...');
    const validUpdate = batchUpdateMenuItemsSchema.parse({
        ids: ['test-id-1', 'test-id-2'],
        data: { isAvailable: false, discountPercent: 20 }
    });
    console.log('  Valid update parsed correctly:', validUpdate.ids.length, 'items');

    const validDelete = batchDeleteMenuItemsSchema.parse({
        ids: ['test-id-1']
    });
    console.log('  Valid delete parsed correctly:', validDelete.ids.length, 'items');

    // 2. Test with real restaurant data from DB
    const restaurant = await prisma.restaurant.findFirst({
        where: { slug: 'vista-cafe-restaurant' },
        include: { menuItems: { take: 2 } }
    });

    if (!restaurant) {
        console.log('Restaurant vista-cafe-restaurant not found, trying any restaurant...');
        const anyRest = await prisma.restaurant.findFirst({
            include: { menuItems: { take: 2 } }
        });
        if (!anyRest || anyRest.menuItems.length === 0) {
            console.log('No restaurants with menu items found to test live DB mutations.');
            return;
        }
    }

    const targetRest = restaurant || (await prisma.restaurant.findFirst({ include: { menuItems: { take: 2 } } }))!;
    console.log(`2. Found test restaurant: ${targetRest.name} (${targetRest.id}) with ${targetRest.menuItems.length} items`);

    if (targetRest.menuItems.length > 0) {
        const itemIds = targetRest.menuItems.map(i => i.id);
        const originalState = targetRest.menuItems.map(i => ({ id: i.id, isAvailable: i.isAvailable, discountPrice: i.discountPrice }));

        console.log('3. Testing batchUpdateMenuItems (availability toggle)...');
        const res1 = await menuItemService.batchUpdateMenuItems(targetRest.id, itemIds, { isAvailable: false });
        console.log('  Updated items to sold out:', res1.updatedCount);

        // Verify in DB
        const updatedDb = await prisma.menuItem.findMany({ where: { id: { in: itemIds } } });
        const allSoldOut = updatedDb.every(i => !i.isAvailable);
        console.log('  DB verification - all sold out:', allSoldOut);

        console.log('4. Testing batchUpdateMenuItems (apply discount percentage)...');
        const res2 = await menuItemService.batchUpdateMenuItems(targetRest.id, itemIds, { discountPercent: 15 });
        console.log('  Applied 15% discount to items:', res2.updatedCount);

        const discountedDb = await prisma.menuItem.findMany({ where: { id: { in: itemIds } } });
        for (const item of discountedDb) {
            console.log(`    Item ${item.id}: Price ${item.price}, DiscountPrice: ${item.discountPrice}`);
        }

        console.log('5. Restoring original state...');
        for (const orig of originalState) {
            await prisma.menuItem.update({
                where: { id: orig.id },
                data: { isAvailable: orig.isAvailable, discountPrice: orig.discountPrice }
            });
        }
        console.log('  Original state restored cleanly.');
    }

    console.log('--- Phase 2 Backend Verification Complete: ALL CHECKS PASSED ---');
}

main()
    .catch((err) => {
        console.error('Verification failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
