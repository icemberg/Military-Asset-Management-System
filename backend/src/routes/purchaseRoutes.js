import express from 'express';
import { createPurchase, getPurchases } from '../controllers/purchaseController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', enforceBaseScope, getPurchases);
router.post('/', authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'), enforceBaseScope, createPurchase);

export default router;
