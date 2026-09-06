import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/AdminService';
import { TelegramBotService } from '../services/TelegramBotService';
import { config } from '../config/env';

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
            tier: req.query.tier as string,
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

export const getBroadcast = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const broadcast = await adminService.getLatestBroadcast();
        res.json(broadcast || null);
    } catch (error) {
        next(error);
    }
};

export const setBroadcast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const broadcast = await adminService.setBroadcast(req.body, req.user!.userId);
        res.json(broadcast);
    } catch (error) {
        next(error);
    }
};

export const getTelegramStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const isConfigured = TelegramBotService.isConfigured();
        const isEnabled = await TelegramBotService.isAlertsEnabled();
        const adminCount = config.telegramAdminChatIds.length;
        res.json({ isConfigured, isEnabled, adminCount });
    } catch (error) {
        next(error);
    }
};

export const toggleTelegramBot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { enabled } = req.body;
        const updated = await TelegramBotService.setAlertsEnabled(Boolean(enabled));
        res.json({ success: true, isEnabled: updated });
    } catch (error) {
        next(error);
    }
};

export const sendTelegramTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!TelegramBotService.isConfigured()) {
            res.status(400).json({ error: 'Telegram bot is not configured (missing token or admin chat IDs).' });
            return;
        }

        const adminName = (req as any).user?.name || (req as any).user?.email || 'Super Admin';
        const timestamp = new Date().toISOString();
        const testMessage = [
            `🔔 <b>OURMENU TELEGRAM BOT TEST ALERT</b>`,
            `━━━━━━━━━━━━━━━━━━━━━`,
            `<b>Status:</b> ✅ Notifications are connected!`,
            `<b>Triggered By:</b> ${adminName}`,
            `<b>Server Time:</b> <code>${timestamp}</code>`,
            `\n<i>All system crashes, database outages, and client error alerts will be delivered to this chat.</i>`,
        ].join('\n');

        const result = await TelegramBotService.broadcastToAdmins(testMessage, true);
        if (result.successful === 0 && result.failures.length > 0) {
            let errorMsg = result.failures.join('; ');
            if (errorMsg.includes("can't initiate conversation") || errorMsg.includes('chat not found')) {
                errorMsg += ' — You must open your bot in Telegram and click "Start" before it can send you alerts.';
            }
            res.status(400).json({ error: `Telegram alert delivery failed: ${errorMsg}` });
            return;
        }

        res.json({
            success: true,
            message: `Test alert sent successfully to ${result.successful} admin chat(s).`,
        });
    } catch (error) {
        next(error);
    }
};

