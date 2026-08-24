import prisma from './src/config/database';

async function main() {
    const user = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { restaurant: { include: { qrCodes: true } } }
    });
    console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
