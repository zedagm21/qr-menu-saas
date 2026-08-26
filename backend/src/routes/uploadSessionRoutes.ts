import { Router } from 'express';
import { UploadSessionController } from '../controllers/uploadSessionController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Create session (called from desktop admin dashboard)
router.post('/', authenticate, UploadSessionController.createSession);

// Poll session status (called from desktop admin dashboard)
router.get('/:sessionId/status', UploadSessionController.getStatus);

// Upload photo from phone (called by phone browser via QR code, secured by session token)
router.post(
    '/:sessionId/upload',
    uploadRateLimiter,
    upload.single('image'),
    UploadSessionController.uploadPhoto
);

export default router;
