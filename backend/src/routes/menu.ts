import { Router } from 'express';
import { authenticate, requireRestaurant } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenantGuard';
import { upload } from '../middleware/upload';
import * as categoryController from '../controllers/categoryController';
import * as menuItemController from '../controllers/menuItemController';
import * as qrController from '../controllers/qrController';

const router = Router();
const guard = [authenticate, requireRestaurant, tenantGuard] as const;

// Category routes
router.get('/categories', ...guard, categoryController.getCategories);
router.post('/categories', ...guard, categoryController.createCategory);
router.put('/categories/reorder', ...guard, categoryController.reorderCategories);
router.put('/categories/:id', ...guard, categoryController.updateCategory);
router.delete('/categories/:id', ...guard, categoryController.deleteCategory);

// Menu item routes
router.get('/menu-items', ...guard, menuItemController.getMenuItems);
router.post('/menu-items', ...guard, menuItemController.createMenuItem);
router.put('/menu-items/reorder', ...guard, menuItemController.reorderMenuItems);
router.get('/menu-items/:id', ...guard, menuItemController.getMenuItem);
router.put('/menu-items/:id', ...guard, menuItemController.updateMenuItem);
router.delete('/menu-items/:id', ...guard, menuItemController.deleteMenuItem);
router.post('/menu-items/:id/image', ...guard, upload.single('image'), menuItemController.uploadMenuItemImage);

// QR routes
router.get('/qr', ...guard, qrController.getQRCodes);
router.post('/qr', ...guard, qrController.ensureQRCode);
router.delete('/qr/:id', ...guard, qrController.deleteQRCode);

export default router;
