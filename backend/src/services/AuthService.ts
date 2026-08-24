import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config/env';
import { generateSlug, ensureUniqueSlug } from '../utils/slug';
import { createError } from '../middleware/errorHandler';
import type { RegisterInput, LoginInput, UpdatePasswordInput } from '../validators/auth';
import type { AuthPayload } from '../middleware/auth';

export class AuthService {
    async register(input: RegisterInput) {
        const existing = await prisma.user.findUnique({ where: { email: input.email } });
        if (existing) {
            throw createError('Email already registered', 409);
        }

        const passwordHash = await bcrypt.hash(input.password, 12);
        const baseSlug = generateSlug(input.restaurantName);
        const slug = await ensureUniqueSlug(baseSlug);

        // Create restaurant + user + default theme in a transaction
        const { user, restaurant } = await prisma.$transaction(async (tx) => {
            const restaurant = await tx.restaurant.create({
                data: {
                    name: input.restaurantName,
                    slug,
                    theme: {
                        create: {
                            primaryColor: '#D97706',
                            accentColor: '#F59E0B',
                            fontFamily: 'Inter',
                            menuStyle: 'CLASSIC',
                            darkMode: 'LIGHT',
                        },
                    },
                },
            });

            const user = await tx.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    passwordHash,
                    role: 'OWNER',
                    restaurantId: restaurant.id,
                },
            });

            return { user, restaurant };
        });

        const token = this.signToken({ userId: user.id, restaurantId: restaurant.id, role: user.role });
        return { user: this.sanitizeUser(user), restaurant, token };
    }

    async login(input: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { email: input.email },
            include: { restaurant: true },
        });

        if (!user) {
            throw createError('Invalid email or password', 401);
        }

        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
            throw createError('Invalid email or password', 401);
        }

        const token = this.signToken({
            userId: user.id,
            restaurantId: user.restaurantId,
            role: user.role,
        });

        return { user: this.sanitizeUser(user), restaurant: user.restaurant, token };
    }

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurant: true },
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        return { user: this.sanitizeUser(user), restaurant: user.restaurant };
    }

    async updatePassword(userId: string, input: UpdatePasswordInput) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw createError('User not found', 404);
        }

        const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isValid) {
            throw createError('Invalid current password', 400);
        }

        const passwordHash = await bcrypt.hash(input.newPassword, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }

    private signToken(payload: AuthPayload): string {
        return jwt.sign(payload as object, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
        });
    }

    // Strip sensitive fields before returning to client
    private sanitizeUser(user: { id: string; name: string; email: string; role: string; restaurantId: string | null; createdAt: Date; updatedAt: Date; passwordHash?: string }) {
        const { passwordHash: _, ...safe } = user as typeof user & { passwordHash: string };
        return safe;
    }
}

export const authService = new AuthService();
