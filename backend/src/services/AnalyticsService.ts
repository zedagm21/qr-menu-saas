import crypto from 'crypto';
import prisma from '../config/database';
import { Language, InteractionType } from '@prisma/client';

export interface ScanRecordInput {
    qrCodeId?: string;
    tableNumber?: string;
    userAgent?: string;
    language?: 'EN' | 'AM';
    ip?: string;
}

export class AnalyticsService {
    /**
     * Record a diner scan event (privacy-preserving)
     */
    async recordScan(restaurantId: string, input: ScanRecordInput): Promise<void> {
        try {
            const ua = input.userAgent || '';
            let os: string = 'Other';
            if (/iPad|iPhone|iPod/.test(ua)) {
                os = 'iOS';
            } else if (/Android/.test(ua)) {
                os = 'Android';
            }

            let device: string = 'Mobile';
            if (/iPad|Tablet/i.test(ua)) {
                device = 'Tablet';
            } else if (!/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
                device = 'Desktop';
            }

            // Anonymized daily IP hash for unique visitor estimation
            let ipHash: string | undefined = undefined;
            if (input.ip) {
                const today = new Date().toISOString().slice(0, 10);
                ipHash = crypto
                    .createHash('sha256')
                    .update(`${input.ip}-${restaurantId}-${today}`)
                    .digest('hex');
            }

            const langEnum = input.language === 'AM' ? Language.AM : Language.EN;

            await prisma.scanEvent.create({
                data: {
                    restaurantId,
                    qrCodeId: input.qrCodeId || null,
                    tableNumber: input.tableNumber || null,
                    device,
                    os,
                    language: langEnum,
                    ipHash: ipHash || null,
                },
            });
        } catch (err) {
            console.error('[AnalyticsService] Error recording scan:', err);
        }
    }

    /**
     * Record dish detail modal view
     */
    async recordItemClick(restaurantId: string, menuItemId: string): Promise<void> {
        try {
            await prisma.menuItemClick.create({
                data: {
                    restaurantId,
                    menuItemId,
                },
            });
        } catch (err) {
            console.error('[AnalyticsService] Error recording item click:', err);
        }
    }

    /**
     * Record public search query (unmet customer demand)
     */
    async recordSearchQuery(restaurantId: string, query: string, resultsCount: number = 0): Promise<void> {
        try {
            const cleanQuery = query?.trim().toLowerCase();
            if (!cleanQuery || cleanQuery.length < 2) return;

            await prisma.searchQueryLog.create({
                data: {
                    restaurantId,
                    query: cleanQuery.slice(0, 100),
                    resultsCount,
                },
            });
        } catch (err) {
            console.error('[AnalyticsService] Error recording search query:', err);
        }
    }

    /**
     * Record profile detail view or social media link click
     */
    async recordInteraction(
        restaurantId: string,
        type: 'PROFILE_VIEW' | 'SOCIAL_CLICK' | 'CALL_CLICK' | 'DIRECTIONS_CLICK',
        platform?: string
    ): Promise<void> {
        try {
            const interactionType = InteractionType[type];
            if (!interactionType) return;

            await prisma.profileInteraction.create({
                data: {
                    restaurantId,
                    type: interactionType,
                    platform: platform ? platform.toLowerCase().trim() : null,
                },
            });
        } catch (err) {
            console.error('[AnalyticsService] Error recording profile interaction:', err);
        }
    }

    /**
     * Retrieve aggregated analytics for a restaurant
     */
    async getRestaurantAnalytics(restaurantId: string, timeframe: string = '7d') {
        const now = new Date();
        let startDate = new Date();
        let priorStartDate = new Date();
        let isHourly = false;

        switch (timeframe) {
            case '24h':
                startDate.setHours(now.getHours() - 24);
                priorStartDate.setHours(now.getHours() - 48);
                isHourly = true;
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                priorStartDate.setDate(now.getDate() - 60);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                priorStartDate.setDate(now.getDate() - 180);
                break;
            case 'all':
                startDate = new Date(2020, 0, 1);
                priorStartDate = new Date(2020, 0, 1);
                break;
            case '7d':
            default:
                startDate.setDate(now.getDate() - 7);
                priorStartDate.setDate(now.getDate() - 14);
                break;
        }

        // 1. Fetch scan events in timeframe
        const [currentScans, priorScanCount, itemClicks, searches, interactions] = await Promise.all([
            prisma.scanEvent.findMany({
                where: {
                    restaurantId,
                    createdAt: { gte: startDate },
                },
                select: {
                    createdAt: true,
                    os: true,
                    language: true,
                    ipHash: true,
                    tableNumber: true,
                },
            }),
            prisma.scanEvent.count({
                where: {
                    restaurantId,
                    createdAt: { gte: priorStartDate, lt: startDate },
                },
            }),
            prisma.menuItemClick.groupBy({
                by: ['menuItemId'],
                where: {
                    restaurantId,
                    createdAt: { gte: startDate },
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: { id: 'desc' },
                },
                take: 10,
            }),
            prisma.searchQueryLog.groupBy({
                by: ['query'],
                where: {
                    restaurantId,
                    createdAt: { gte: startDate },
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: { id: 'desc' },
                },
                take: 10,
            }),
            prisma.profileInteraction.findMany({
                where: {
                    restaurantId,
                    createdAt: { gte: startDate },
                },
                select: {
                    type: true,
                    platform: true,
                },
            }),
        ]);

        const totalScans = currentScans.length;
        const uniqueDiners = new Set(currentScans.map((s) => s.ipHash).filter(Boolean)).size;

        // Scan growth percentage
        let scanGrowthPct = 0;
        if (priorScanCount > 0) {
            scanGrowthPct = Math.round(((totalScans - priorScanCount) / priorScanCount) * 100);
        } else if (totalScans > 0) {
            scanGrowthPct = 100;
        }

        // Peak Hours (24 hours: 0 - 23)
        const hourCounts = new Array(24).fill(0);
        currentScans.forEach((s) => {
            const h = new Date(s.createdAt).getHours();
            hourCounts[h]++;
        });

        let peakHourIndex = 13; // default 1 PM
        let maxScansInHour = 0;
        hourCounts.forEach((count, idx) => {
            if (count > maxScansInHour) {
                maxScansInHour = count;
                peakHourIndex = idx;
            }
        });

        const peakHourFormatted = `${peakHourIndex % 12 || 12}:00 ${peakHourIndex >= 12 ? 'PM' : 'AM'} – ${(peakHourIndex + 1) % 12 || 12}:00 ${peakHourIndex + 1 >= 12 ? 'PM' : 'AM'}`;

        // Timeline aggregation
        const timelineMap = new Map<string, number>();
        if (isHourly) {
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                const key = `${d.getHours()}:00`;
                timelineMap.set(key, 0);
            }
            currentScans.forEach((s) => {
                const key = `${new Date(s.createdAt).getHours()}:00`;
                if (timelineMap.has(key)) {
                    timelineMap.set(key, (timelineMap.get(key) || 0) + 1);
                }
            });
        } else {
            const daysCount = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;
            for (let i = daysCount - 1; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const key = d.toISOString().slice(0, 10);
                timelineMap.set(key, 0);
            }
            currentScans.forEach((s) => {
                const key = new Date(s.createdAt).toISOString().slice(0, 10);
                if (timelineMap.has(key)) {
                    timelineMap.set(key, (timelineMap.get(key) || 0) + 1);
                }
            });
        }

        const timeline = Array.from(timelineMap.entries()).map(([label, count]) => ({
            label,
            count,
        }));

        // Device OS breakdown (Mobile only)
        let iosCount = 0;
        let androidCount = 0;
        let otherOsCount = 0;
        let enCount = 0;
        let amCount = 0;

        currentScans.forEach((s) => {
            if (s.os === 'iOS') iosCount++;
            else if (s.os === 'Android') androidCount++;
            else otherOsCount++;

            if (s.language === 'AM') amCount++;
            else enCount++;
        });

        // Top dishes details
        const topItemIds = itemClicks.map((i) => i.menuItemId);
        const menuItems = await prisma.menuItem.findMany({
            where: { id: { in: topItemIds } },
            include: {
                translations: true,
                category: { include: { translations: true } },
            },
        });

        const totalClicks = itemClicks.reduce((sum, item) => sum + item._count.id, 0);
        const topDishes = itemClicks.map((ic) => {
            const dish = menuItems.find((m) => m.id === ic.menuItemId);
            const enName = dish?.translations.find((t) => t.language === 'EN')?.name || dish?.translations[0]?.name || 'Item';
            const amName = dish?.translations.find((t) => t.language === 'AM')?.name;
            const catName = dish?.category?.translations.find((t) => t.language === 'EN')?.name || 'Category';

            return {
                id: ic.menuItemId,
                name: enName,
                amName: amName || null,
                category: catName,
                price: dish ? Number(dish.price) : 0,
                imageUrl: dish?.imageUrl || null,
                clicks: ic._count.id,
                sharePct: totalClicks > 0 ? Math.round((ic._count.id / totalClicks) * 100) : 0,
            };
        });

        // Interactions (Profile views, Social clicks, Calls, Directions)
        let profileViews = 0;
        let callClicks = 0;
        let directionsClicks = 0;
        const socialPlatforms: Record<string, number> = {};

        interactions.forEach((inter) => {
            if (inter.type === 'PROFILE_VIEW') profileViews++;
            else if (inter.type === 'CALL_CLICK') callClicks++;
            else if (inter.type === 'DIRECTIONS_CLICK') directionsClicks++;
            else if (inter.type === 'SOCIAL_CLICK' && inter.platform) {
                socialPlatforms[inter.platform] = (socialPlatforms[inter.platform] || 0) + 1;
            }
        });

        const topSearches = searches.map((s) => ({
            query: s.query,
            count: s._count.id,
        }));

        return {
            summary: {
                totalScans,
                uniqueDiners,
                scanGrowthPct,
                peakHour: peakHourFormatted,
                topDish: topDishes[0]?.name || 'N/A',
                profileViews,
                totalSocialClicks: Object.values(socialPlatforms).reduce((a, b) => a + b, 0),
                callClicks,
                directionsClicks,
            },
            timeline,
            peakHours: hourCounts.map((count, hour) => ({
                hour,
                label: `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`,
                count,
            })),
            topDishes,
            topSearches,
            devices: {
                ios: iosCount,
                android: androidCount,
                other: otherOsCount,
                iosPct: totalScans > 0 ? Math.round((iosCount / totalScans) * 100) : 0,
                androidPct: totalScans > 0 ? Math.round((androidCount / totalScans) * 100) : 0,
            },
            languages: {
                en: enCount,
                am: amCount,
                enPct: totalScans > 0 ? Math.round((enCount / totalScans) * 100) : 0,
                amPct: totalScans > 0 ? Math.round((amCount / totalScans) * 100) : 0,
            },
            interactions: {
                profileViews,
                callClicks,
                directionsClicks,
                socialPlatforms,
            },
        };
    }

    /**
     * Generate CSV export for analytics
     */
    async generateCsv(restaurantId: string, timeframe: string = '30d'): Promise<string> {
        const data = await this.getRestaurantAnalytics(restaurantId, timeframe);
        const rows: string[] = [];

        rows.push('--- QR MENU SAAS RESTAURANT ANALYTICS REPORT ---');
        rows.push(`Timeframe,${timeframe}`);
        rows.push(`Generated At,${new Date().toISOString()}`);
        rows.push('');

        rows.push('--- SUMMARY ---');
        rows.push(`Total Scans,${data.summary.totalScans}`);
        rows.push(`Unique Diners,${data.summary.uniqueDiners}`);
        rows.push(`Growth %,${data.summary.scanGrowthPct}%`);
        rows.push(`Peak Dining Rush,${data.summary.peakHour}`);
        rows.push(`Top Performing Dish,${data.summary.topDish}`);
        rows.push(`Profile Views,${data.summary.profileViews}`);
        rows.push(`Social Media Clicks,${data.summary.totalSocialClicks}`);
        rows.push(`Phone Call Clicks,${data.summary.callClicks}`);
        rows.push(`Directions Clicks,${data.summary.directionsClicks}`);
        rows.push('');

        rows.push('--- TIMELINE ACTIVITY ---');
        rows.push('Period,Scans');
        data.timeline.forEach((t) => {
            rows.push(`"${t.label}",${t.count}`);
        });
        rows.push('');

        rows.push('--- TOP PERFORMING DISHES ---');
        rows.push('Dish Name,Category,Price,Clicks,Popularity Share %');
        data.topDishes.forEach((d) => {
            rows.push(`"${d.name}","${d.category}",${d.price},${d.clicks},${d.sharePct}%`);
        });
        rows.push('');

        rows.push('--- TOP CUSTOMER SEARCHES ---');
        rows.push('Search Query,Count');
        data.topSearches.forEach((s) => {
            rows.push(`"${s.query}",${s.count}`);
        });

        return rows.join('\n');
    }
}

export const analyticsService = new AnalyticsService();
