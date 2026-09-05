import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, authController.register);
router.post('/verify-otp', authRateLimiter, authController.verifyOtp);
router.post('/resend-otp', authRateLimiter, authController.resendOtp);
router.post('/google', authRateLimiter, authController.googleAuth);
router.post('/login', authRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.get('/me', authenticate, authController.getMe);
router.post('/password', authenticate, authController.updatePassword);

export default router;
