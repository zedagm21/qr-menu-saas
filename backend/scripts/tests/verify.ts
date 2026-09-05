import prisma from '../../src/config/database';

async function main() {
    const restaurants = await prisma.restaurant.findMany({
        select: { id: true, name: true, slug: true, status: true, slugAliases: true }
    });
    console.log(JSON.stringify(restaurants, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
