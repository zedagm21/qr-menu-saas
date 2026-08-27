import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurant';
import menuRoutes from './routes/menu';
import publicRoutes from './routes/public';
import uploadSessionRoutes from './routes/uploadSessionRoutes';
import adminRoutes from './routes/admin';
import analyticsRoutes from './routes/analytics';
import { adminService } from './services/AdminService';

const app = express();

// ─── Trust Proxy ─────────────────────────────────────────────────────────────
// When running behind reverse proxies (like Render, AWS ALB, Nginx),
// trusting the first proxy hop ensures req.ip resolves to the real client IP
// and express-rate-limit correctly identifies users without throwing validation errors.
app.set('trust proxy', 1);

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving images
}));

// Allow both localhost and any configured LAN/production URL
const allowedOrigins = Array.from(new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    config.frontendUrl,
].filter(Boolean)));

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: 'Too many requests, please try again later.',
    skip: (req) => req.path.startsWith('/api/public'), // Public menu has higher limit
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static files (image uploads) ────────────────────────────────────────────
const uploadDir = path.resolve(config.uploadDir);
app.use('/uploads', express.static(uploadDir));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/restaurant/analytics', analyticsRoutes);
app.use('/api', menuRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload-sessions', uploadSessionRoutes);
app.use('/api/admin', adminRoutes);

// ─── Broadcast announcement for authenticated dashboard ─────────────────────
app.get('/api/broadcast/active', async (_req, res, next) => {
    try {
        const broadcast = await adminService.getActiveBroadcast();
        res.json(broadcast || null);
    } catch (error) {
        next(error);
    }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Validation error handler (Zod) — MUST be before generic errorHandler ─────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.name === 'ZodError') {
        res.status(400).json({
            error: 'Validation failed',
            details: err.errors,
        });
        return;
    }
    next(err);
});

// ─── Generic error handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`📂 Uploads directory: ${uploadDir}`);
    console.log(`🌍 Frontend: ${config.frontendUrl}`);
});

export default app;
