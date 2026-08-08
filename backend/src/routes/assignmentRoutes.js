import express from 'express';
import { 
  createAssignment, 
  getAssignments, 
  returnAssignment 
} from '../controllers/assignmentController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post(
  '/', 
  authorizeRoles('ADMIN', 'BASE_COMMANDER'), 
  enforceBaseScope, 
  createAssignment
);

router.get(
  '/', 
  getAssignments
);

// We don't apply enforceBaseScope here directly since baseId is not in req.body.
// The controller will manually check req.user.baseId against the assignment's baseId.
router.post(
  '/:id/return', 
  authorizeRoles('ADMIN', 'BASE_COMMANDER'), 
  returnAssignment
);

export default router;
