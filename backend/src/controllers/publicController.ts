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

export const proxyImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const imageUrl = req.query.url as string;
        if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
            res.status(400).json({ error: 'Valid image URL is required' });
            return;
        }

        const client = imageUrl.startsWith('https') ? https : http;
        client.get(imageUrl, (stream) => {
            if (stream.statusCode && stream.statusCode >= 400) {
                res.status(stream.statusCode).json({ error: 'Failed to fetch upstream image' });
                return;
            }

            const contentType = stream.headers['content-type'] || 'image/webp';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
            res.setHeader('Access-Control-Allow-Origin', '*');
            stream.pipe(res);
        }).on('error', (err) => {
            next(err);
        });
    } catch (error) {
        next(error);
    }
};

// ─── Analytics Tracking Handlers ─────────────────────────────────────────────
import prisma from '../config/database';
import { analyticsService } from '../services/AnalyticsService';

export const recordPublicScan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const restaurant = await prisma.restaurant.findUnique({
            where: { slug },
            select: { id: true, isSuspended: true },
        });

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

        const restaurant = await prisma.restaurant.findUnique({
            where: { slug },
            select: { id: true, isSuspended: true },
        });

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

        const restaurant = await prisma.restaurant.findUnique({
            where: { slug },
            select: { id: true, isSuspended: true },
        });

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

        const restaurant = await prisma.restaurant.findUnique({
            where: { slug },
            select: { id: true, isSuspended: true },
        });

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

