import { Router } from 'express';
import * as publicController from '../controllers/publicController';

const router = Router();

router.get('/restaurants/:slug', publicController.getRestaurantPublic);
router.get('/restaurants/:slug/menu', publicController.getMenuPublic);
router.get('/proxy-image', publicController.proxyImage);

export default router;
