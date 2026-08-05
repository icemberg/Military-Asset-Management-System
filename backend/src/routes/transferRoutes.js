import express from 'express';
import { createTransfer, getTransfers } from '../controllers/transferController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', enforceBaseScope, getTransfers);
router.post('/', authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'), enforceBaseScope, createTransfer);

export default router;
