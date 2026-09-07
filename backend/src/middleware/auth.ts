import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthPayload {
    userId: string;
    restaurantId: string | null;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = req.cookies?.token || bearerToken;

    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload & { exp?: number };
        req.user = {
            userId: decoded.userId,
            restaurantId: decoded.restaurantId,
            role: decoded.role,
        };

        // Allow platform Super Admins to manage/impersonate another restaurant
        if (req.user.role === 'ADMIN') {
            const impersonateHeader = req.headers['x-impersonate-restaurant-id'];
            if (typeof impersonateHeader === 'string' && impersonateHeader.trim()) {
                req.user.restaurantId = impersonateHeader.trim();
            }
        }

        // 30-Day Rolling Session (Sliding Window):
        // If token has less than 15 days remaining, refresh it back to 30 days
        if (decoded.exp) {
            const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
            const fifteenDaysInSeconds = 15 * 24 * 60 * 60;
            if (remainingSeconds < fifteenDaysInSeconds) {
                const refreshedToken = jwt.sign(
                    {
                        userId: decoded.userId,
                        restaurantId: decoded.restaurantId,
                        role: decoded.role,
                    },
                    config.jwtSecret,
                    { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
                );
                res.cookie('token', refreshedToken, {
                    httpOnly: true,
                    secure: config.isProduction,
                    sameSite: 'lax',
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                });
                res.setHeader('x-token-refreshed', 'true');
            }
        }

        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requireRestaurant = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.restaurantId) {
        res.status(403).json({ error: 'Restaurant association required' });
        return;
    }
    next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Super Admin access required' });
        return;
    }
    next();
};
