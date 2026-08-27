import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    restaurantName: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

export const resendOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const googleAuthSchema = z.object({
    credential: z.string().min(1, 'Google credential token is required'),
});

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
