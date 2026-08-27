import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { publicMenuService } from './PublicMenuService';
import { auditService } from './AuditService';
import { MenuStatus, Role } from '@prisma/client';

export class AdminService {
    /**
     * Platform-wide overview metrics & KPIs for Super Admin
     */
    async getOverviewMetrics() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalRestaurants,
            publishedRestaurants,
            draftRestaurants,
            suspendedRestaurants,
            totalUsers,
            verifiedUsers,
            totalMenuItems,
            totalCategories,
            totalScans,
            todayScans,
            weekScans,
            recentAudits,
            recentUsers,
            recentRestaurants,
        ] = await Promise.all([
            prisma.restaurant.count(),
            prisma.restaurant.count({ where: { status: MenuStatus.PUBLISHED, isSuspended: false } }),
            prisma.restaurant.count({ where: { status: MenuStatus.DRAFT, isSuspended: false } }),
            prisma.restaurant.count({ where: { isSuspended: true } }),
            prisma.user.count(),
            prisma.user.count({ where: { emailVerified: true } }),
            prisma.menuItem.count(),
            prisma.category.count(),
            prisma.scanEvent.count(),
            prisma.scanEvent.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma.scanEvent.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    user: { select: { name: true, email: true } },
                    restaurant: { select: { name: true, slug: true } },
                },
            }),
            prisma.user.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true },
            }),
            prisma.restaurant.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true },
            }),
        ]);

        // Build 30-day daily signup timeline
        const timelineMap = new Map<string, { date: string; users: number; restaurants: number }>();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            timelineMap.set(key, { date: key, users: 0, restaurants: 0 });
        }

        recentUsers.forEach((u) => {
            const key = u.createdAt.toISOString().slice(0, 10);
            if (timelineMap.has(key)) {
                timelineMap.get(key)!.users++;
            }
        });

        recentRestaurants.forEach((r) => {
            const key = r.createdAt.toISOString().slice(0, 10);
            if (timelineMap.has(key)) {
                timelineMap.get(key)!.restaurants++;
            }
        });

        return {
            restaurants: {
                total: totalRestaurants,
                published: publishedRestaurants,
                draft: draftRestaurants,
                suspended: suspendedRestaurants,
            },
            users: {
                total: totalUsers,
                verified: verifiedUsers,
                unverified: totalUsers - verifiedUsers,
            },
            catalog: {
                totalItems: totalMenuItems,
                totalCategories: totalCategories,
            },
            scans: {
                total: totalScans,
                today: todayScans,
                week: weekScans,
            },
            signupTimeline: Array.from(timelineMap.values()),
            recentAudits,
        };
    }

    /**
     * List all restaurants with search, filter, and stats
     */
    async listRestaurants(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }) {
        const page = Math.max(Number(params.page) || 1, 1);
        const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        if (params.search?.trim()) {
            const query = params.search.trim();
            whereClause.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { users: { some: { email: { contains: query, mode: 'insensitive' } } } },
                { users: { some: { name: { contains: query, mode: 'insensitive' } } } },
            ];
        }

        if (params.status === 'SUSPENDED') {
            whereClause.isSuspended = true;
        } else if (params.status === 'PUBLISHED') {
            whereClause.isSuspended = false;
            whereClause.status = MenuStatus.PUBLISHED;
        } else if (params.status === 'DRAFT') {
            whereClause.isSuspended = false;
            whereClause.status = MenuStatus.DRAFT;
        }

        const [total, restaurants] = await Promise.all([
            prisma.restaurant.count({ where: whereClause }),
            prisma.restaurant.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    users: {
                        select: { id: true, name: true, email: true, role: true, emailVerified: true },
                        take: 2,
                    },
                    _count: {
                        select: {
                            menuItems: true,
                            categories: true,
                            scanEvents: true,
                        },
                    },
                },
            }),
        ]);

        return {
            data: restaurants.map((r) => ({
                id: r.id,
                name: r.name,
                slug: r.slug,
                logoUrl: r.logoUrl,
                status: r.status,
                isSuspended: r.isSuspended,
                suspensionReason: r.suspensionReason,
                city: r.city,
                country: r.country,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                owner: r.users[0] || null,
                itemCount: r._count.menuItems,
                categoryCount: r._count.categories,
                scanCount: r._count.scanEvents,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Grant or revoke restaurant access (suspend / activate) or change status
     */
    async updateRestaurantAccess(
        restaurantId: string,
        data: { isSuspended?: boolean; suspensionReason?: string | null; status?: MenuStatus },
        adminUserId: string
    ) {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            throw createError('Restaurant not found', 404);
        }

        const updateData: any = {};
        if (data.isSuspended !== undefined) {
            updateData.isSuspended = data.isSuspended;
            updateData.suspensionReason = data.isSuspended ? data.suspensionReason || 'Account suspended by platform administrator' : null;
        }
        if (data.status !== undefined) {
            updateData.status = data.status;
        }

        const updated = await prisma.restaurant.update({
            where: { id: restaurantId },
            data: updateData,
        });

        await publicMenuService.invalidateCache(restaurantId);

        let action = 'RESTAURANT_UPDATED';
        if (data.isSuspended === true) action = 'RESTAURANT_SUSPENDED';
        else if (data.isSuspended === false) action = 'RESTAURANT_ACTIVATED';

        await auditService.logAction({
            action,
            userId: adminUserId,
            restaurantId,
            details: {
                previous: { isSuspended: restaurant.isSuspended, status: restaurant.status },
                updated: { isSuspended: updated.isSuspended, status: updated.status, reason: updated.suspensionReason },
            },
        });

        return updated;
    }

    /**
     * Permanently delete a restaurant
     */
    async deleteRestaurant(restaurantId: string, adminUserId: string) {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { id: true, name: true, slug: true },
        });

        if (!restaurant) {
            throw createError('Restaurant not found', 404);
        }

        await prisma.restaurant.delete({
            where: { id: restaurantId },
        });

        await publicMenuService.invalidateCache(restaurant.slug);

        await auditService.logAction({
            action: 'RESTAURANT_DELETED',
            userId: adminUserId,
            details: { name: restaurant.name, slug: restaurant.slug },
        });

        return { success: true };
    }

    /**
     * List all platform users ("who registered when")
     */
    async listUsers(params: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        verified?: string;
    }) {
        const page = Math.max(Number(params.page) || 1, 1);
        const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        if (params.search?.trim()) {
            const query = params.search.trim();
            whereClause.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (params.role && params.role !== 'ALL') {
            whereClause.role = params.role as Role;
        }

        if (params.verified === 'true') {
            whereClause.emailVerified = true;
        } else if (params.verified === 'false') {
            whereClause.emailVerified = false;
        }

        const [total, users] = await Promise.all([
            prisma.user.count({ where: whereClause }),
            prisma.user.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    restaurant: {
                        select: { id: true, name: true, slug: true, isSuspended: true, status: true },
                    },
                },
            }),
        ]);

        return {
            data: users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                emailVerified: u.emailVerified,
                isGoogleUser: !!u.googleId,
                restaurant: u.restaurant,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Promote or demote user role (OWNER <-> ADMIN)
     */
    async updateUserRole(userId: string, role: Role, adminUserId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw createError('User not found', 404);
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        await auditService.logAction({
            action: 'ROLE_UPDATED',
            userId: adminUserId,
            details: { targetUserId: userId, targetEmail: user.email, newRole: role },
        });

        return updated;
    }

    /**
     * Manually mark user as verified
     */
    async verifyUserEmail(userId: string, adminUserId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw createError('User not found', 404);
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerified: true,
                emailVerificationOtp: null,
                emailVerificationExpires: null,
            },
        });

        await auditService.logAction({
            action: 'USER_VERIFIED',
            userId: adminUserId,
            details: { targetUserId: userId, targetEmail: user.email, manual: true },
        });

        return updated;
    }

    /**
     * Delete user
     */
    async deleteUser(userId: string, adminUserId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw createError('User not found', 404);
        }

        await prisma.user.delete({ where: { id: userId } });

        await auditService.logAction({
            action: 'USER_DELETED',
            userId: adminUserId,
            details: { targetEmail: user.email, targetName: user.name },
        });

        return { success: true };
    }

    /**
     * List audit logs with action filter & search
     */
    async listAuditLogs(params: {
        page?: number;
        limit?: number;
        action?: string;
        search?: string;
    }) {
        const page = Math.max(Number(params.page) || 1, 1);
        const limit = Math.min(Math.max(Number(params.limit) || 25, 1), 100);
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        if (params.action && params.action !== 'ALL') {
            whereClause.action = params.action;
        }

        if (params.search?.trim()) {
            const query = params.search.trim();
            whereClause.OR = [
                { action: { contains: query, mode: 'insensitive' } },
                { user: { name: { contains: query, mode: 'insensitive' } } },
                { user: { email: { contains: query, mode: 'insensitive' } } },
                { restaurant: { name: { contains: query, mode: 'insensitive' } } },
            ];
        }

        const [total, logs] = await Promise.all([
            prisma.auditLog.count({ where: whereClause }),
            prisma.auditLog.findMany({
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
}

export const adminService = new AdminService();
