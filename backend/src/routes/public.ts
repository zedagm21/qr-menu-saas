import { Router } from 'express';
import * as publicController from '../controllers/publicController';

const router = Router();

router.get('/restaurants/:slug', publicController.getRestaurantPublic);
router.get('/restaurants/:slug/menu', publicController.getMenuPublic);

export default router;
