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
    getBroadcast,
    setBroadcast,
} from '../controllers/adminController';
import {
    getSystemLogs,
    getSystemLogMetrics,
    updateSystemLogStatus,
    batchUpdateSystemLogStatus,
    purgeSystemLogs,
} from '../controllers/systemLogController';

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
router.get('/broadcast', getBroadcast);
router.post('/broadcast', setBroadcast);

// System diagnostics, error log tracking and reporting
router.get('/logs', getSystemLogs);
router.get('/logs/metrics', getSystemLogMetrics);
router.patch('/logs/:id/status', updateSystemLogStatus);
router.post('/logs/batch-status', batchUpdateSystemLogStatus);
router.delete('/logs/purge', purgeSystemLogs);

export default router;
