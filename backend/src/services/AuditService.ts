import prisma from '../config/database';

export interface LogActionParams {
    action: string;
    userId?: string | null;
    restaurantId?: string | null;
    details?: any;
    ipAddress?: string | null;
}

export class AuditService {
    async logAction(params: LogActionParams): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    action: params.action,
                    userId: params.userId || null,
                    restaurantId: params.restaurantId || null,
                    details: params.details ?? undefined,
                    ipAddress: params.ipAddress || null,
                },
            });
        } catch (error) {
            // Non-blocking: never fail user transactions if audit log fails
            console.error('[AuditService] Failed to record audit log:', params.action, error);
        }
    }
}

export const auditService = new AuditService();
