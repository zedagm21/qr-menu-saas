import prisma from '../src/config/database';

async function main() {
    const email = process.argv[2]?.toLowerCase().trim();
    if (!email) {
        console.error('❌ Error: Email argument is required. Usage: npm run make:admin <email>');
        process.exit(1);
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error(`❌ Error: User with email "${email}" not found.`);
            process.exit(1);
        }

        const updated = await prisma.user.update({
            where: { email },
            data: {
                role: 'ADMIN',
                emailVerified: true,
            },
        });

        console.log(`✅ Success: User "${updated.name}" (${updated.email}) is now a Super Admin (Role: ADMIN).`);
    } catch (err) {
        console.error('❌ Failed to update user role:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
