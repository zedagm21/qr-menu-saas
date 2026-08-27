import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/AdminService';

export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const metrics = await adminService.getOverviewMetrics();
        res.json(metrics);
    } catch (error) {
        next(error);
    }
};

export const listRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await adminService.listRestaurants({
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            search: req.query.search as string,
            status: req.query.status as string,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updateRestaurantAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const updated = await adminService.updateRestaurantAccess(
            req.params.id,
            req.body,
            req.user!.userId
        );
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

export const deleteRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await adminService.deleteRestaurant(req.params.id, req.user!.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await adminService.listUsers({
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            search: req.query.search as string,
            role: req.query.role as string,
            verified: req.query.verified as string,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const updated = await adminService.updateUserRole(
            req.params.id,
            req.body.role,
            req.user!.userId
        );
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

export const verifyUserEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const updated = await adminService.verifyUserEmail(req.params.id, req.user!.userId);
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await adminService.deleteUser(req.params.id, req.user!.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await adminService.listAuditLogs({
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            action: req.query.action as string,
            search: req.query.search as string,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};
