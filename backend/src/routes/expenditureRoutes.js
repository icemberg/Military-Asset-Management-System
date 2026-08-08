import express from 'express';
import { 
  createExpenditure, 
  getExpenditures 
} from '../controllers/expenditureController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post(
  '/', 
  authorizeRoles('ADMIN', 'BASE_COMMANDER'), 
  enforceBaseScope, 
  createExpenditure
);

router.get(
  '/', 
  enforceBaseScope,
  getExpenditures
);

export default router;
