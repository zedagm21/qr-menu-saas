import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { LogLevel, LogSource, LogStatus } from '@prisma/client';
import { systemLogService } from '../services/SystemLogService';
import { createError } from '../middleware/errorHandler';

const clientErrorSchema = z.object({
    message: z.string().min(1, 'Message is required').max(2000),
    stack: z.string().max(10000).optional().nullable(),
    path: z.string().max(500).optional().nullable(),
    level: z.enum(['FATAL', 'ERROR', 'WARN', 'INFO']).optional(),
    metadata: z.record(z.any()).optional().nullable(),
});

export const getSystemLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, level, source, status, search, startDate, endDate } = req.query;
        const result = await systemLogService.listLogs({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            level: level ? String(level) : undefined,
            source: source ? String(source) : undefined,
            status: status ? String(status) : undefined,
            search: search ? String(search) : undefined,
            startDate: startDate ? String(startDate) : undefined,
            endDate: endDate ? String(endDate) : undefined,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getSystemLogMetrics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = await systemLogService.getMetrics();
        res.json(metrics);
    } catch (error) {
        next(error);
    }
};

export const updateSystemLogStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['UNRESOLVED', 'RESOLVED', 'IGNORED'].includes(status)) {
            throw createError('Invalid status value', 400);
        }

        const adminUserId = (req as any).user?.id || (req as any).user?.email || 'admin';
        const updated = await systemLogService.updateStatus(id, status as LogStatus, adminUserId);
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

export const batchUpdateSystemLogStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids, status } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            throw createError('ids array is required', 400);
        }

        if (!status || !['UNRESOLVED', 'RESOLVED', 'IGNORED'].includes(status)) {
            throw createError('Invalid status value', 400);
        }

        const adminUserId = (req as any).user?.id || (req as any).user?.email || 'admin';
        const result = await systemLogService.batchUpdateStatus(ids, status as LogStatus, adminUserId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const purgeSystemLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const olderThanDays = req.query.olderThanDays ? Number(req.query.olderThanDays) : 30;
        const status = req.query.status && ['UNRESOLVED', 'RESOLVED', 'IGNORED'].includes(String(req.query.status))
            ? (String(req.query.status) as LogStatus)
            : undefined;

        const result = await systemLogService.purgeOldLogs({ olderThanDays, status });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const reportClientError = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = clientErrorSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid error report payload', details: parsed.error.format() });
            return;
        }

        const { message, stack, path, level, metadata } = parsed.data;

        await systemLogService.recordLog({
            level: (level as LogLevel) || LogLevel.ERROR,
            source: LogSource.FRONTEND,
            message,
            stack: stack || null,
            path: path || null,
            ipAddress: req.ip || null,
            userAgent: req.get('user-agent') || null,
            metadata: metadata || null,
            userId: (req as any).user?.id || null,
            restaurantId: (req as any).user?.restaurantId || null,
        });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
