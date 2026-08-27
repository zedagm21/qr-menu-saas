import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
    googleAuthSchema,
    updatePasswordSchema,
} from '../validators/auth';
import { config } from '../config/env';

const cookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.register(data);
        // Note: No session cookie set here because email OTP verification is required
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = verifyOtpSchema.parse(req.body);
        const result = await authService.verifyEmailOtp(data.email, data.otp);
        res.cookie('token', result.token, cookieOptions);
        res.json({ user: result.user, restaurant: result.restaurant, token: result.token });
    } catch (error) {
        next(error);
    }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = resendOtpSchema.parse(req.body);
        const result = await authService.resendOtp(data.email);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = googleAuthSchema.parse(req.body);
        const result = await authService.googleAuth(data.credential);
        res.cookie('token', result.token, cookieOptions);
        res.json({
            user: result.user,
            restaurant: result.restaurant,
            token: result.token,
            isNewUser: result.isNewUser,
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await authService.login(data);
        res.cookie('token', result.token, cookieOptions);
        res.json({ user: result.user, restaurant: result.restaurant, token: result.token });
    } catch (error) {
        next(error);
    }
};

export const logout = (_req: Request, res: Response): void => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
    });
    res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await authService.getMe(req.user!.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = updatePasswordSchema.parse(req.body);
        await authService.updatePassword(req.user!.userId, data);
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};
