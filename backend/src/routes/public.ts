import { Router } from 'express';
import * as publicController from '../controllers/publicController';
import { publicRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply public rate limiter to prevent analytics and scraping abuse
router.use(publicRateLimiter);

router.get('/restaurants/:slug', publicController.getRestaurantPublic);
router.get('/restaurants/:slug/menu', publicController.getMenuPublic);
router.get('/proxy-image', publicController.proxyImage);

// ─── Analytics Tracking ──────────────────────────────────────────────────────
router.post('/restaurants/:slug/scan', publicController.recordPublicScan);
router.post('/restaurants/:slug/item-click', publicController.recordPublicItemClick);
router.post('/restaurants/:slug/search', publicController.recordPublicSearch);
router.post('/restaurants/:slug/interaction', publicController.recordPublicInteraction);

export default router;

