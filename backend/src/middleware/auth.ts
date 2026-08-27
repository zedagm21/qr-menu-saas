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
        const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
        req.user = payload;
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
