import { Router } from 'express';
import { authenticate, requireRestaurant } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenantGuard';
import { upload } from '../middleware/upload';
import * as restaurantController from '../controllers/restaurantController';

const router = Router();
const guard = [authenticate, requireRestaurant, tenantGuard] as const;

router.get('/', ...guard, restaurantController.getRestaurant);
router.put('/', ...guard, restaurantController.updateRestaurant);
router.put('/theme', ...guard, restaurantController.updateTheme);
router.get('/stats', ...guard, restaurantController.getStats);
router.post('/publish', ...guard, restaurantController.publishMenu);
router.post('/logo', ...guard, upload.single('image'), restaurantController.updateLogo);
router.post('/cover', ...guard, upload.single('image'), restaurantController.updateCoverImage);

export default router;
