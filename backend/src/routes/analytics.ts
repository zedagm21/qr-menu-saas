import { Router } from 'express';
import { authenticate, requireRestaurant } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenantGuard';
import { getAnalytics, exportAnalyticsCsv } from '../controllers/analyticsController';

const router = Router();

// Enforce authentication, restaurant context, and tenant isolation
router.use(authenticate, requireRestaurant, tenantGuard);

router.get('/', getAnalytics);
router.get('/export', exportAnalyticsCsv);

export default router;
