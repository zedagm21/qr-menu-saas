import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database';
import { config } from '../config/env';
import { generateSlug, ensureUniqueSlug } from '../utils/slug';
import { createError } from '../middleware/errorHandler';
import { emailService } from './EmailService';
import { auditService } from './AuditService';
import type { RegisterInput, LoginInput, UpdatePasswordInput, ForgotPasswordInput, ResetPasswordInput } from '../validators/auth';
import type { AuthPayload } from '../middleware/auth';

const googleClient = new OAuth2Client(config.googleClientId);

export class AuthService {
    private isSuperAdmin(email: string): boolean {
        return config.superAdminEmails.includes(email.toLowerCase().trim());
    }
    /**
     * Register a new user with email and password.
     * Generates a 6-digit OTP and sends it via email without logging them in immediately.
     */
    async register(input: RegisterInput) {
        const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase().trim() } });
        if (existing) {
            throw createError('Email already registered', 409);
        }

        const passwordHash = await bcrypt.hash(input.password, 12);
        const restaurantName = input.restaurantName?.trim() || 'My Restaurant';
        const baseSlug = generateSlug(restaurantName);
        const slug = await ensureUniqueSlug(baseSlug);

        // Generate 6-digit OTP code and 15-minute expiration
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

        // Create restaurant + user + default theme in a transaction
        const { user } = await prisma.$transaction(async (tx) => {
            const restaurant = await tx.restaurant.create({
                data: {
                    name: restaurantName,
                    slug,
                    translations: {
                        create: [
                            {
                                language: 'EN',
                                name: restaurantName,
                                description: null,
                                address: null,
                                city: null,
                            },
                        ],
                    },
                    theme: {
                        create: {
                            primaryColor: '#D97706',
                            accentColor: '#F59E0B',
                            fontFamily: 'Inter',
                            menuStyle: 'CLASSIC',
                            darkMode: 'AUTO',
                        },
                    },
                },
                include: { translations: true, theme: true },
            });

            const role = this.isSuperAdmin(input.email) ? 'ADMIN' : 'OWNER';

            const user = await tx.user.create({
                data: {
                    name: input.name.trim(),
                    email: input.email.toLowerCase().trim(),
                    passwordHash,
                    emailVerified: false,
                    emailVerificationOtp: otp,
                    emailVerificationExpires: otpExpires,
                    role,
                    restaurantId: restaurant.id,
                },
            });

            return { user, restaurant };
        });

        // Log audit event
        auditService.logAction({
            action: 'USER_REGISTERED',
            userId: user.id,
            restaurantId: user.restaurantId,
            details: { email: user.email, name: user.name, role: user.role },
        });

        // Dispatch verification email in the background
        emailService.sendVerificationOtp(user.email, otp, user.name).catch((err) => {
            console.error('Failed to send verification OTP in register:', err);
        });

        return {
            success: true,
            email: user.email,
            requiresVerification: true,
        };
    }

    /**
     * Verifies the 6-digit OTP entered by the user.
     * On success, sets emailVerified = true and issues the authenticated JWT token.
     */
    async verifyEmailOtp(email: string, otp: string) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { restaurant: true },
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        if (user.emailVerified) {
            // Already verified, issue token
            const token = this.signToken({
                userId: user.id,
                restaurantId: user.restaurantId,
                role: user.role,
            });
            return { user: this.sanitizeUser(user), restaurant: user.restaurant, token };
        }

        if (!user.emailVerificationOtp || user.emailVerificationOtp !== otp.trim()) {
            throw createError('Invalid verification code. Please check your code and try again.', 400);
        }

        if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
            throw createError('Verification code has expired. Please request a new one.', 400);
        }

        // Mark verified and clear OTP fields, and auto-sync admin role if configured
        const role = this.isSuperAdmin(user.email) ? 'ADMIN' : user.role;

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationOtp: null,
                emailVerificationExpires: null,
                resendAttemptsCount: 0,
                role,
            },
            include: { restaurant: true },
        });

        auditService.logAction({
            action: 'USER_VERIFIED',
            userId: updatedUser.id,
            restaurantId: updatedUser.restaurantId,
            details: { email: updatedUser.email, role: updatedUser.role },
        });

        const token = this.signToken({
            userId: updatedUser.id,
            restaurantId: updatedUser.restaurantId,
            role: updatedUser.role,
        });

        return { user: this.sanitizeUser(updatedUser), restaurant: updatedUser.restaurant, token };
    }

    /**
     * Resends a fresh 6-digit OTP to the user's email.
     * Enforces rate limiting: 60s cooldown between attempts, and max 5 attempts per hour.
     */
    async resendOtp(email: string) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user) {
            throw createError('User not found', 404);
        }

        if (user.emailVerified) {
            return { success: true, message: 'Email is already verified' };
        }

        const now = new Date();
        const lastAttempt = user.lastResendAttemptAt;

        // 1. Check 60-second cooldown
        if (lastAttempt && now.getTime() - lastAttempt.getTime() < 60 * 1000) {
            const secondsLeft = Math.ceil((60 * 1000 - (now.getTime() - lastAttempt.getTime())) / 1000);
            throw createError(`Please wait ${secondsLeft} seconds before requesting another code.`, 429);
        }

        // 2. Check 1-hour rate limit (max 5 requests per hour)
        let attemptsCount = user.resendAttemptsCount + 1;
        if (lastAttempt && now.getTime() - lastAttempt.getTime() > 60 * 60 * 1000) {
            // An hour has passed, reset counter
            attemptsCount = 1;
        } else if (user.resendAttemptsCount >= 5) {
            throw createError('Too many verification requests. Please wait an hour before trying again.', 429);
        }

        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationOtp: otp,
                emailVerificationExpires: otpExpires,
                resendAttemptsCount: attemptsCount,
                lastResendAttemptAt: now,
            },
        });

        await emailService.sendVerificationOtp(user.email, otp, user.name);

        return { success: true, message: 'Verification code sent' };
    }

    /**
     * Authenticate user with email and password.
     * If user is unverified, blocks login with EMAIL_NOT_VERIFIED error.
     */
    async login(input: LoginInput) {
        const normalizedEmail = input.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { restaurant: true },
        });

        if (!user) {
            throw createError('Invalid email or password', 401);
        }

        if (!user.passwordHash) {
            throw createError('This account was created with Google. Please use "Continue with Google" to sign in.', 400);
        }

        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
            throw createError('Invalid email or password', 401);
        }

        // Check if user has verified their email
        if (!user.emailVerified) {
            throw createError('EMAIL_NOT_VERIFIED', 403, { email: user.email });
        }

        // Auto-promote to ADMIN if configured in superAdminEmails
        let activeUser = user;
        if (this.isSuperAdmin(user.email) && user.role !== 'ADMIN') {
            activeUser = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN' },
                include: { restaurant: true },
            });
        }

        auditService.logAction({
            action: 'USER_LOGIN',
            userId: activeUser.id,
            restaurantId: activeUser.restaurantId,
            details: { email: activeUser.email, role: activeUser.role, provider: 'password' },
        });

        const token = this.signToken({
            userId: activeUser.id,
            restaurantId: activeUser.restaurantId,
            role: activeUser.role,
        });

        return { user: this.sanitizeUser(activeUser), restaurant: activeUser.restaurant, token };
    }

    /**
     * Authenticate or register with Google OAuth ID token (credential).
     * Google accounts are automatically marked verified.
     */
    async googleAuth(credential: string) {
        if (!credential) {
            throw createError('Google credential token is required', 400);
        }

        let payload;
        try {
            // Verify ID token with Google's public keys
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: config.googleClientId || undefined,
            });
            payload = ticket.getPayload();
        } catch (err: any) {
            console.error('Google token verification failed:', err);
            throw createError('Invalid or expired Google token', 401);
        }

        if (!payload || !payload.email) {
            throw createError('Google profile did not provide a valid email', 400);
        }

        const googleEmail = payload.email.toLowerCase().trim();
        const googleId = payload.sub;
        const name = payload.name || payload.given_name || 'Google User';

        // Check if user exists by googleId or email
        let user = await prisma.user.findFirst({
            where: {
                OR: [{ googleId }, { email: googleEmail }],
            },
            include: { restaurant: true },
        });

        let isNewUser = false;

        if (user) {
            // Existing user: Link googleId and ensure verified
            if (!user.googleId || !user.emailVerified) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: user.googleId || googleId,
                        emailVerified: true,
                        emailVerificationOtp: null,
                        emailVerificationExpires: null,
                    },
                    include: { restaurant: true },
                });
            }
        } else {
            // Brand new user: Create User + placeholder Restaurant in transaction
            isNewUser = true;
            const restaurantName = 'My Restaurant';
            const baseSlug = generateSlug(restaurantName);
            const slug = await ensureUniqueSlug(baseSlug);

            const result = await prisma.$transaction(async (tx) => {
                const restaurant = await tx.restaurant.create({
                    data: {
                        name: restaurantName,
                        slug,
                        translations: {
                            create: [
                                {
                                    language: 'EN',
                                    name: restaurantName,
                                    description: null,
                                    address: null,
                                    city: null,
                                },
                            ],
                        },
                        theme: {
                            create: {
                                primaryColor: '#D97706',
                                accentColor: '#F59E0B',
                                fontFamily: 'Inter',
                                menuStyle: 'CLASSIC',
                                darkMode: 'AUTO',
                            },
                        },
                    },
                    include: { translations: true, theme: true },
                });

                const role = this.isSuperAdmin(googleEmail) ? 'ADMIN' : 'OWNER';

                const newUser = await tx.user.create({
                    data: {
                        name,
                        email: googleEmail,
                        googleId,
                        emailVerified: true,
                        passwordHash: null,
                        role,
                        restaurantId: restaurant.id,
                    },
                    include: { restaurant: true },
                });

                return { user: newUser, restaurant };
            });

            user = result.user;
        }

        // Auto-promote existing google user to ADMIN if configured
        if (this.isSuperAdmin(user.email) && user.role !== 'ADMIN') {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN' },
                include: { restaurant: true },
            });
        }

        auditService.logAction({
            action: isNewUser ? 'USER_REGISTERED' : 'USER_LOGIN',
            userId: user.id,
            restaurantId: user.restaurantId,
            details: { email: user.email, provider: 'google', isNewUser },
        });

        const token = this.signToken({
            userId: user.id,
            restaurantId: user.restaurantId,
            role: user.role,
        });

        return {
            user: this.sanitizeUser(user),
            restaurant: user.restaurant,
            token,
            isNewUser,
        };
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

        if (!user.passwordHash) {
            throw createError('This account does not use a password (signed up with Google).', 400);
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

    /**
     * Initiates password reset for a user.
     * Generates a 6-digit OTP and sends it via email.
     * Rate-limited to 60s cooldown and 5 requests per hour.
     */
    async forgotPassword(email: string) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        // Anti-enumeration: If user does not exist, return generic success
        if (!user) {
            return {
                success: true,
                message: 'If an account exists with this email address, a password reset code has been sent.',
            };
        }

        // If user only registered with Google (no password)
        if (!user.passwordHash && user.googleId) {
            throw createError('This account was created with Google. Please use "Continue with Google" to sign in.', 400);
        }

        const now = new Date();
        const lastAttempt = user.lastResetAttemptAt;

        // 1. Check 60-second cooldown
        if (lastAttempt && now.getTime() - lastAttempt.getTime() < 60 * 1000) {
            const secondsLeft = Math.ceil((60 * 1000 - (now.getTime() - lastAttempt.getTime())) / 1000);
            throw createError(`Please wait ${secondsLeft} seconds before requesting another code.`, 429);
        }

        // 2. Check 1-hour rate limit (max 5 requests per hour)
        let attemptsCount = user.resetPasswordAttempts + 1;
        if (lastAttempt && now.getTime() - lastAttempt.getTime() > 60 * 60 * 1000) {
            // An hour has passed, reset counter
            attemptsCount = 1;
        } else if (user.resetPasswordAttempts >= 5) {
            throw createError('Too many password reset requests. Please wait an hour before trying again.', 429);
        }

        // Generate 6-digit OTP code and 15-minute expiration
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordOtp: otp,
                resetPasswordExpires: otpExpires,
                resetPasswordAttempts: attemptsCount,
                lastResetAttemptAt: now,
            },
        });

        // Audit log
        auditService.logAction({
            action: 'PASSWORD_RESET_REQUESTED',
            userId: user.id,
            restaurantId: user.restaurantId,
            details: { email: user.email },
        });

        // Dispatch email in background
        emailService.sendPasswordResetOtp(user.email, otp, user.name).catch((err) => {
            console.error('Failed to send password reset OTP:', err);
        });

        return {
            success: true,
            message: 'Password reset code sent to your email.',
        };
    }

    /**
     * Resets the user's password using the 6-digit OTP code.
     */
    async resetPassword(input: ResetPasswordInput) {
        const normalizedEmail = input.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            throw createError('Invalid email or reset code.', 400);
        }

        if (!user.resetPasswordOtp || user.resetPasswordOtp !== input.otp.trim()) {
            throw createError('Invalid reset code. Please check the code and try again.', 400);
        }

        if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
            throw createError('Reset code has expired. Please request a new code.', 400);
        }

        const passwordHash = await bcrypt.hash(input.password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetPasswordOtp: null,
                resetPasswordExpires: null,
                resetPasswordAttempts: 0,
                emailVerified: true, // Proving email ownership marks email verified
            },
        });

        auditService.logAction({
            action: 'PASSWORD_RESET_COMPLETED',
            userId: user.id,
            restaurantId: user.restaurantId,
            details: { email: user.email },
        });

        return {
            success: true,
            message: 'Password reset successfully. You can now sign in with your new password.',
        };
    }

    private signToken(payload: AuthPayload): string {
        return jwt.sign(payload as object, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
        });
    }

    // Strip sensitive fields before returning to client
    private sanitizeUser(user: {
        id: string;
        name: string;
        email: string;
        role: string;
        restaurantId: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        passwordHash?: string | null;
        emailVerificationOtp?: string | null;
        resetPasswordOtp?: string | null;
    }) {
        const { passwordHash: _, emailVerificationOtp: __, resetPasswordOtp: ___, ...safe } = user as any;
        return safe;
    }
}

export const authService = new AuthService();
