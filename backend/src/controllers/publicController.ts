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

