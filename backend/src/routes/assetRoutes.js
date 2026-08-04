import express from 'express';
import { getDashboardMetrics } from '../controllers/assetController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/metrics', enforceBaseScope, getDashboardMetrics);

export default router;
