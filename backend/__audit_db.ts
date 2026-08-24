import prisma from './src/config/database';

async function main() {
    const restaurants = await prisma.restaurant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, slug: true, status: true, defaultLanguage: true, createdAt: true },
    });
    console.log('\n===== RESTAURANTS =====');
    for (const r of restaurants) {
        console.log(`ID=${r.id} NAME=${r.name} SLUG=${r.slug} STATUS=${r.status} LANG=${r.defaultLanguage}`);
    }

    const qrCodes = await prisma.qRCode.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, restaurantId: true, isActive: true },
    });
    console.log('\n===== QR CODES =====');
    for (const q of qrCodes) {
        const rest = restaurants.find(r => r.id === q.restaurantId);
        console.log(`restaurantId=${q.restaurantId} slug=${rest?.slug} isActive=${q.isActive}`);
    }

    const cats = await prisma.category.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { translations: { select: { language: true, name: true } } },
    });
    console.log('\n===== CATEGORIES =====');
    for (const c of cats) {
        const rest = restaurants.find(r => r.id === c.restaurantId);
        const en = c.translations.find((t) => t.language === 'EN');
        console.log(`catId=${c.id} slug=${rest?.slug} isActive=${c.isActive} name_en=${en?.name}`);
    }

    const items = await prisma.menuItem.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { translations: { select: { language: true, name: true } } },
    });
    console.log('\n===== MENU ITEMS =====');
    for (const i of items) {
        const rest = restaurants.find(r => r.id === i.restaurantId);
        const en = i.translations.find((t) => t.language === 'EN');
        console.log(`itemId=${i.id} slug=${rest?.slug} name=${en?.name} price=${i.price} avail=${i.isAvailable}`);
    }

    await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
