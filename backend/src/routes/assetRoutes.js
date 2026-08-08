import express from 'express';
import { getDashboardMetrics, getBases, getEquipmentTypes } from '../controllers/assetController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/metrics', enforceBaseScope, getDashboardMetrics);
router.get('/bases', getBases);
router.get('/equipment-types', getEquipmentTypes);

export default router;
