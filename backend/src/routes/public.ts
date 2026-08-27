import { Router } from 'express';
import * as publicController from '../controllers/publicController';

const router = Router();

router.get('/restaurants/:slug', publicController.getRestaurantPublic);
router.get('/restaurants/:slug/menu', publicController.getMenuPublic);
router.get('/proxy-image', publicController.proxyImage);

// ─── Analytics Tracking ──────────────────────────────────────────────────────
router.post('/restaurants/:slug/scan', publicController.recordPublicScan);
router.post('/restaurants/:slug/item-click', publicController.recordPublicItemClick);
router.post('/restaurants/:slug/search', publicController.recordPublicSearch);
router.post('/restaurants/:slug/interaction', publicController.recordPublicInteraction);

export default router;

