import { Request, Response, NextFunction } from 'express';

/**
 * Tenant isolation middleware.
 * Verifies that the authenticated user belongs to the restaurant being accessed.
 * restaurantId is ALWAYS taken from the JWT payload (req.user), never from the request body.
 * This prevents cross-tenant data access.
 */
export const tenantGuard = (req: Request, res: Response, next: NextFunction): void => {
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

    next();
};
