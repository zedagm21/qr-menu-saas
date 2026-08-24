import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for auth endpoints (login, register).
 * Prevents brute-force attacks.
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many auth attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * General API rate limiter for protected dashboard routes.
 */
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Lenient rate limiter for public menu routes.
 * These are customer-facing and may receive high traffic.
 */
export const publicRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 120,
    message: { error: 'Too many requests. Please try again shortly.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict limiter for image upload endpoints.
 */
export const uploadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: { error: 'Too many uploads. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
