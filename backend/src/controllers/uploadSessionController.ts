import { Request, Response, NextFunction } from 'express';
import { uploadSessionService } from '../services/UploadSessionService';
import { ImageProcessor, IMAGE_DIMENSION_LIMITS } from '../services/ImageProcessor';
import { imageStorage } from '../services/ImageStorageService';
import { createError } from '../middleware/errorHandler';

export class UploadSessionController {
    /**
     * POST /api/upload-sessions
     * Initializes a new temporary camera upload session.
     */
    static async createSession(req: Request, res: Response, next: NextFunction) {
        try {
            const restaurantId = (req as any).user?.restaurantId;
            const session = uploadSessionService.createSession(restaurantId);

            res.status(201).json({
                success: true,
                data: {
                    sessionId: session.id,
                    token: session.token,
                    expiresAt: session.expiresAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/upload-sessions/:sessionId/status
     * Polled by desktop to check if photo has been uploaded.
     */
    static async getStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;
            const token = req.query.token as string;

            if (!token) {
                return next(createError('Session token is required.', 400));
            }

            const session = uploadSessionService.getSession(sessionId, token);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    data: { status: 'EXPIRED' },
                });
            }

            res.json({
                success: true,
                data: {
                    status: session.status,
                    imageUrl: session.imageUrl || null,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/upload-sessions/:sessionId/upload
     * Uploads the photo taken by smartphone camera.
     */
    static async uploadPhoto(req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;
            const token = (req.body.token || req.query.token) as string;

            if (!token) {
                return next(createError('Session token is required.', 400));
            }

            const session = uploadSessionService.getSession(sessionId, token);
            if (!session) {
                return next(createError('Upload session expired or invalid. Please scan a new QR code.', 404));
            }

            if (!req.file) {
                return next(createError('No image file provided.', 400));
            }

            // Process image: Magic bytes validation, auto-rotate, resize within 1600x1600, convert to WebP
            const processed = await ImageProcessor.processImage(
                req.file.buffer,
                IMAGE_DIMENSION_LIMITS.MENU_ITEM
            );

            // Save optimized WebP image
            const imageUrl = await imageStorage.save(processed.buffer, 'webp');

            // Complete the companion session
            uploadSessionService.completeSession(sessionId, token, imageUrl);

            res.json({
                success: true,
                message: 'Photo captured and sent successfully.',
                data: {
                    imageUrl,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
