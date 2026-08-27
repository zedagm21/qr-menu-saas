import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

/**
 * Tenant isolation and suspension middleware.
 * Verifies that the authenticated user belongs to the restaurant being accessed.
 * Allows Super Admin bypass for impersonation.
 * Enforces read-only mode if the restaurant is suspended.
 */
export const tenantGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Super Admins can manage any restaurant directly
    if (req.user?.role === 'ADMIN') {
        next();
        return;
    }

    const userRestaurantId = req.user?.restaurantId;

    // If route has a restaurantId param (e.g. /api/restaurants/:restaurantId), verify match
    const paramRestaurantId = req.params.restaurantId;
    if (paramRestaurantId && userRestaurantId && paramRestaurantId !== userRestaurantId) {
        res.status(403).json({ error: 'Access denied: cross-tenant operation not allowed' });
        return;
    }

    // If body has a restaurantId field, strip it — we always use JWT restaurantId
    if (req.body && typeof req.body === 'object' && 'restaurantId' in req.body) {
        delete req.body.restaurantId;
    }

    // Enforcement: If restaurant is suspended, block modifying actions (Read-Only Mode)
    if (userRestaurantId && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        try {
            const restaurant = await prisma.restaurant.findUnique({
                where: { id: userRestaurantId },
                select: { isSuspended: true, suspensionReason: true },
            });

            if (restaurant?.isSuspended) {
                res.status(403).json({
                    error: 'Restaurant account is currently suspended. Modifications are disabled.',
                    isSuspended: true,
                    reason: restaurant.suspensionReason || 'Account suspended by platform administrator',
                });
                return;
            }
        } catch {
            // Proceed on DB read failure to let generic error handling take over if needed
        }
    }

    next();
};

