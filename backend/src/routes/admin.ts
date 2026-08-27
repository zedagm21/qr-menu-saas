import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
    getOverview,
    listRestaurants,
    updateRestaurantAccess,
    deleteRestaurant,
    listUsers,
    updateUserRole,
    verifyUserEmail,
    deleteUser,
    listAuditLogs,
} from '../controllers/adminController';

const router = Router();

// Enforce authentication and platform Super Admin role
router.use(authenticate, requireAdmin);

router.get('/overview', getOverview);
router.get('/restaurants', listRestaurants);
router.patch('/restaurants/:id/access', updateRestaurantAccess);
router.delete('/restaurants/:id', deleteRestaurant);

router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/verify', verifyUserEmail);
router.delete('/users/:id', deleteUser);

router.get('/activity', listAuditLogs);

export default router;
