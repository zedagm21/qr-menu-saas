import prisma from '../config/database';
import { LogLevel, LogSource, LogStatus } from '@prisma/client';
import { TelegramBotService } from './TelegramBotService';

export interface RecordLogParams {
    level?: LogLevel;
    source?: LogSource;
    message: string;
    stack?: string | null;
    statusCode?: number | null;
    path?: string | null;
    method?: string | null;
    endpoint?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: any;
    userId?: string | null;
    restaurantId?: string | null;
}

export interface ListLogsParams {
    page?: number;
    limit?: number;
    level?: string;
    source?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

const SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'token',
    'accesstoken',
    'refreshtoken',
    'authorization',
    'secret',
    'otp',
    'resetpasswordotp',
    'emailverificationotp',
    'creditcard',
    'cvv',
]);

/**
 * Recursively masks sensitive fields in metadata JSON objects
 */
export function sanitizeMetadata(data: any, depth = 0): any {
    if (depth > 5 || data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        return data.map((item) => sanitizeMetadata(item, depth + 1));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            sanitized[key] = '***MASKED***';
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeMetadata(value, depth + 1);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

export class SystemLogService {
    /**
     * Non-blocking log recording. Safely catches any internal errors.
     */
    async recordLog(params: RecordLogParams): Promise<void> {
        try {
            const cleanMessage = String(params.message || 'Unknown Error').slice(0, 2000);
            const cleanStack = params.stack ? String(params.stack).slice(0, 10000) : null;
            const cleanPath = params.path ? String(params.path).slice(0, 500) : null;
            const cleanUserAgent = params.userAgent ? String(params.userAgent).slice(0, 500) : null;
            const sanitizedMetadata = params.metadata ? sanitizeMetadata(params.metadata) : undefined;

            await prisma.systemLog.create({
                data: {
                    level: params.level || LogLevel.ERROR,
                    source: params.source || LogSource.BACKEND,
                    status: LogStatus.UNRESOLVED,
                    message: cleanMessage,
                    stack: cleanStack,
                    statusCode: typeof params.statusCode === 'number' ? params.statusCode : null,
                    path: cleanPath,
                    method: params.method ? String(params.method).toUpperCase().slice(0, 10) : null,
                    endpoint: params.endpoint ? String(params.endpoint).slice(0, 255) : null,
                    ipAddress: params.ipAddress ? String(params.ipAddress).slice(0, 64) : null,
                    userAgent: cleanUserAgent,
                    metadata: sanitizedMetadata ?? undefined,
                    userId: params.userId || null,
                    restaurantId: params.restaurantId || null,
                },
            });

            // Asynchronously trigger Telegram alert if bot is active
            try {
                if (params.source === LogSource.FRONTEND) {
                    if (params.level === LogLevel.FATAL || params.level === LogLevel.ERROR) {
                        TelegramBotService.sendClientCrashAlert({
                            message: cleanMessage,
                            url: cleanPath || undefined,
                            userAgent: cleanUserAgent || undefined,
                            userId: params.userId || undefined,
                            stack: cleanStack || undefined,
                        }).catch(() => {});
                    }
                } else {
                    const lowerMsg = cleanMessage.toLowerCase();
                    const isDbError =
                        lowerMsg.includes('prisma') ||
                        lowerMsg.includes('database') ||
                        lowerMsg.includes('connection pool') ||
                        lowerMsg.includes('econnrefused') ||
                        Boolean(params.stack && params.stack.includes('PrismaClient'));

                    if (isDbError) {
                        TelegramBotService.sendDatabaseFailureAlert({
                            message: cleanMessage,
                            endpoint: params.path || params.endpoint || undefined,
                            stack: cleanStack || undefined,
                        }).catch(() => {});
                    } else if (params.statusCode === 500 || params.level === LogLevel.FATAL) {
                        TelegramBotService.sendErrorAlert({
                            statusCode: params.statusCode,
                            message: cleanMessage,
                            path: cleanPath,
                            method: params.method,
                            stack: cleanStack,
                            userId: params.userId,
                            restaurantId: params.restaurantId,
                            source: params.source,
                            metadata: sanitizedMetadata,
                        }).catch(() => {});
                    }
                }
            } catch {
                // Non-blocking
            }
        } catch (error) {
            // Never crash caller process if system log persistence fails
            console.error('[SystemLogService] Failed to persist system log:', error);
        }
    }


    /**
     * Paginated list of system logs with comprehensive filtering
     */
    async listLogs(params: ListLogsParams) {
        const page = Math.max(Number(params.page) || 1, 1);
        const limit = Math.min(Math.max(Number(params.limit) || 25, 1), 100);
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        if (params.level && params.level !== 'ALL' && ['FATAL', 'ERROR', 'WARN', 'INFO'].includes(params.level)) {
            whereClause.level = params.level as LogLevel;
        }

        if (params.source && params.source !== 'ALL' && ['BACKEND', 'FRONTEND'].includes(params.source)) {
            whereClause.source = params.source as LogSource;
        }

        if (params.status && params.status !== 'ALL' && ['UNRESOLVED', 'RESOLVED', 'IGNORED'].includes(params.status)) {
            whereClause.status = params.status as LogStatus;
        }

        if (params.startDate || params.endDate) {
            whereClause.createdAt = {};
            if (params.startDate) whereClause.createdAt.gte = new Date(params.startDate);
            if (params.endDate) whereClause.createdAt.lte = new Date(params.endDate);
        }

        if (params.search?.trim()) {
            const query = params.search.trim();
            whereClause.OR = [
                { message: { contains: query, mode: 'insensitive' } },
                { path: { contains: query, mode: 'insensitive' } },
                { stack: { contains: query, mode: 'insensitive' } },
                { ipAddress: { contains: query, mode: 'insensitive' } },
                { user: { email: { contains: query, mode: 'insensitive' } } },
                { user: { name: { contains: query, mode: 'insensitive' } } },
                { restaurant: { name: { contains: query, mode: 'insensitive' } } },
                { restaurant: { slug: { contains: query, mode: 'insensitive' } } },
            ];
        }

        const [total, logs] = await Promise.all([
            prisma.systemLog.count({ where: whereClause }),
            prisma.systemLog.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    restaurant: { select: { id: true, name: true, slug: true } },
                },
            }),
        ]);

        return {
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Compute aggregated KPIs and error timelines for diagnostics reporting
     */
    async getMetrics() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            unresolvedCount,
            last24hErrors,
            prev24hErrors,
            last24hFatal,
            last7dTotal,
            backendCount,
            frontendCount,
            recentLogs,
        ] = await Promise.all([
            prisma.systemLog.count({ where: { status: LogStatus.UNRESOLVED } }),
            prisma.systemLog.count({
                where: {
                    level: { in: [LogLevel.ERROR, LogLevel.FATAL] },
                    createdAt: { gte: oneDayAgo },
                },
            }),
            prisma.systemLog.count({
                where: {
                    level: { in: [LogLevel.ERROR, LogLevel.FATAL] },
                    createdAt: { gte: twoDaysAgo, lt: oneDayAgo },
                },
            }),
            prisma.systemLog.count({
                where: {
                    level: LogLevel.FATAL,
                    createdAt: { gte: oneDayAgo },
                },
            }),
            prisma.systemLog.count({
                where: { createdAt: { gte: sevenDaysAgo } },
            }),
            prisma.systemLog.count({
                where: {
                    source: LogSource.BACKEND,
                    createdAt: { gte: sevenDaysAgo },
                },
            }),
            prisma.systemLog.count({
                where: {
                    source: LogSource.FRONTEND,
                    createdAt: { gte: sevenDaysAgo },
                },
            }),
            prisma.systemLog.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true, level: true, message: true },
                orderBy: { createdAt: 'desc' },
                take: 1000,
            }),
        ]);

        // Construct 7-day timeline map
        const timelineMap = new Map<string, { date: string; total: number; errors: number; fatal: number; warnings: number }>();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            timelineMap.set(key, { date: key, total: 0, errors: 0, fatal: 0, warnings: 0 });
        }

        // Aggregate top recurring errors
        const messageCounts = new Map<string, { message: string; count: number; lastSeen: Date; level: string }>();

        recentLogs.forEach((log) => {
            const key = log.createdAt.toISOString().slice(0, 10);
            if (timelineMap.has(key)) {
                const day = timelineMap.get(key)!;
                day.total++;
                if (log.level === LogLevel.ERROR) day.errors++;
                else if (log.level === LogLevel.FATAL) day.fatal++;
                else if (log.level === LogLevel.WARN) day.warnings++;
            }

            // Group by first line of message
            const firstLine = log.message.split('\n')[0].slice(0, 120);
            if (messageCounts.has(firstLine)) {
                messageCounts.get(firstLine)!.count++;
            } else {
                messageCounts.set(firstLine, {
                    message: firstLine,
                    count: 1,
                    lastSeen: log.createdAt,
                    level: log.level,
                });
            }
        });

        const topIssues = Array.from(messageCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            unresolvedCount,
            last24hErrors,
            prev24hErrors,
            last24hFatal,
            last7dTotal,
            backendCount,
            frontendCount,
            timeline: Array.from(timelineMap.values()),
            topIssues,
        };
    }

    /**
     * Mark a single log as RESOLVED, UNRESOLVED, or IGNORED
     */
    async updateStatus(id: string, status: LogStatus, adminUserId?: string) {
        return prisma.systemLog.update({
            where: { id },
            data: {
                status,
                resolvedAt: status === LogStatus.RESOLVED ? new Date() : null,
                resolvedBy: status === LogStatus.RESOLVED ? adminUserId || 'admin' : null,
            },
        });
    }

    /**
     * Bulk update status for multiple logs
     */
    async batchUpdateStatus(ids: string[], status: LogStatus, adminUserId?: string) {
        if (!ids || ids.length === 0) return { count: 0 };
        return prisma.systemLog.updateMany({
            where: { id: { in: ids } },
            data: {
                status,
                resolvedAt: status === LogStatus.RESOLVED ? new Date() : null,
                resolvedBy: status === LogStatus.RESOLVED ? adminUserId || 'admin' : null,
            },
        });
    }

    /**
     * Purge logs older than X days (default 30 days) to prevent table bloat
     */
    async purgeOldLogs(params: { olderThanDays?: number; status?: LogStatus }) {
        const days = Math.max(Number(params.olderThanDays) || 30, 1);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const where: any = {
            createdAt: { lt: cutoff },
        };

        if (params.status) {
            where.status = params.status;
        }

        const result = await prisma.systemLog.deleteMany({ where });
        return { deletedCount: result.count, cutoffDate: cutoff };
    }
}

export const systemLogService = new SystemLogService();
