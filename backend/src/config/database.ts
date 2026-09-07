import { PrismaClient } from '@prisma/client';

// Ensure Neon pooled connections explicitly include pgbouncer=true to disable prepared statements in transaction mode
if (
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.includes('-pooler.') &&
    !process.env.DATABASE_URL.includes('pgbouncer=true')
) {
    const separator = process.env.DATABASE_URL.includes('?') ? '&' : '?';
    process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}pgbouncer=true`;
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

// Persist singleton across all environments to prevent socket leakage
globalForPrisma.prisma = prisma;

export default prisma;
