import { Request, Response, NextFunction } from 'express';
import { publicMenuService } from '../services/PublicMenuService';
import https from 'https';
import http from 'http';

export const getRestaurantPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const lang = (req.query.lang as 'EN' | 'AM') || 'EN';
        const restaurant = await publicMenuService.getRestaurantBySlug(req.params.slug, lang);
        res.json(restaurant);
    } catch (error) {
        next(error);
    }
};

export const getMenuPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const lang = (req.query.lang as 'EN' | 'AM') || 'EN';
        const menu = await publicMenuService.getMenuBySlug(req.params.slug, lang);
        res.json(menu);
    } catch (error) {
        next(error);
    }
};

const PRIVATE_IP_REGEX = /^(localhost|127\.|0\.0\.0\.0|169\.254\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|\[?::1\]?|\[?fc00:|\[?fe80:)/i;

export const proxyImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const imageUrl = req.query.url as string;
        if (!imageUrl) {
            res.status(400).json({ error: 'Valid image URL is required' });
            return;
        }

        let parsed: URL;
        try {
            parsed = new URL(imageUrl);
        } catch {
            res.status(400).json({ error: 'Invalid image URL format' });
            return;
        }

        // 1. Enforce HTTPS only (reject plain HTTP, file://, gopher://, etc.)
        if (parsed.protocol !== 'https:') {
            res.status(400).json({ error: 'Only secure HTTPS image URLs are supported' });
            return;
        }

        // 2. Reject internal, localhost, and cloud metadata IPs
        if (PRIVATE_IP_REGEX.test(parsed.hostname)) {
            res.status(403).json({ error: 'Access to internal or private destinations is forbidden' });
            return;
        }

        // 3. Safe outbound streaming with timeout & Content-Type validation
        const request = https.get(imageUrl, { timeout: 5000 }, (stream) => {
            if (stream.statusCode && (stream.statusCode < 200 || stream.statusCode >= 400)) {
                res.status(stream.statusCode).json({ error: 'Failed to fetch upstream image' });
                return;
            }

            const contentType = stream.headers['content-type'] || '';
            if (!contentType.startsWith('image/')) {
                res.status(400).json({ error: 'Target URL did not return a valid image' });
                return;
            }

            // Cap response size at 5MB to prevent memory exhaustion
            const MAX_BYTES = 5 * 1024 * 1024;
            let downloadedBytes = 0;

            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
            res.setHeader('Access-Control-Allow-Origin', '*');

            stream.on('data', (chunk: Buffer) => {
                downloadedBytes += chunk.length;
                if (downloadedBytes > MAX_BYTES) {
                    stream.destroy();
                    if (!res.headersSent) {
                        res.status(413).json({ error: 'Image file size exceeds 5MB limit' });
                    }
                }
            });

            stream.pipe(res);
        });

        request.on('timeout', () => {
            request.destroy();
            if (!res.headersSent) {
                res.status(504).json({ error: 'Upstream image request timed out' });
            }
        });

        request.on('error', (_err) => {
            if (!res.headersSent) {
                res.status(502).json({ error: 'Failed to retrieve remote image' });
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─── Analytics Tracking Handlers ─────────────────────────────────────────────
import prisma from '../config/database';
import { analyticsService } from '../services/AnalyticsService';

async function resolveRestaurantBySlug(slug: string) {
    const restaurant = await prisma.restaurant.findUnique({
        where: { slug },
        select: { id: true, isSuspended: true },
    });
    if (restaurant) return restaurant;

    const alias = await prisma.restaurantSlugAlias.findUnique({
        where: { oldSlug: slug },
        select: { restaurant: { select: { id: true, isSuspended: true } } },
    });
    return alias?.restaurant || null;
}

export const recordPublicScan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const restaurant = await resolveRestaurantBySlug(slug);

        if (!restaurant || restaurant.isSuspended) {
            res.status(200).json({ success: false });
            return;
        }

        // Fire-and-forget scan recording
        analyticsService.recordScan(restaurant.id, {
            tableNumber: req.body?.tableNumber || req.body?.table || undefined,
            qrCodeId: req.body?.qrCodeId || req.body?.qr || undefined,
            userAgent: req.headers['user-agent'],
            language: req.body?.language === 'AM' ? 'AM' : 'EN',
            ip: req.ip,
        }).catch(() => {});

        res.json({ success: true });
    } catch {
        res.status(200).json({ success: false });
    }
};

export const recordPublicItemClick = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const { menuItemId } = req.body;
        if (!menuItemId) {
            res.json({ success: false });
            return;
        }

        const restaurant = await resolveRestaurantBySlug(slug);

        if (!restaurant || restaurant.isSuspended) {
            res.json({ success: false });
            return;
        }

        analyticsService.recordItemClick(restaurant.id, menuItemId).catch(() => {});
        res.json({ success: true });
    } catch {
        res.json({ success: false });
    }
};

export const recordPublicSearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const { query, resultsCount } = req.body;
        if (!query) {
            res.json({ success: false });
            return;
        }

        const restaurant = await resolveRestaurantBySlug(slug);

        if (!restaurant || restaurant.isSuspended) {
            res.json({ success: false });
            return;
        }

        analyticsService.recordSearchQuery(restaurant.id, query, resultsCount || 0).catch(() => {});
        res.json({ success: true });
    } catch {
        res.json({ success: false });
    }
};

export const recordPublicInteraction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const { type, platform } = req.body;
        if (!type) {
            res.json({ success: false });
            return;
        }

        const restaurant = await resolveRestaurantBySlug(slug);

        if (!restaurant || restaurant.isSuspended) {
            res.json({ success: false });
            return;
        }

        analyticsService.recordInteraction(restaurant.id, type, platform).catch(() => {});
        res.json({ success: true });
    } catch {
        res.json({ success: false });
    }
};

