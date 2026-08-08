import prisma from '../config/db.js';
import { 
  InsufficientInventoryError, 
  ValidationError,
  InvalidAssignmentStateError,
  AuthorizationError,
  NotFoundError
} from '../utils/errors.js';

export const createAssignment = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, quantity, personnelName } = req.body;
    const userId = req.user.id;

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new ValidationError("Quantity must be a positive integer");
    }
    if (!personnelName || typeof personnelName !== 'string') {
      throw new ValidationError("Personnel name is required");
    }

    const bId = Number.parseInt(baseId, 10);
    const eId = Number.parseInt(equipmentTypeId, 10);

    const maxRetries = 3;
    let retries = 0;
    let result;

    while (retries < maxRetries) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const purchaseAgg = await tx.purchase.aggregate({
            _sum: { quantity: true },
            where: { baseId: bId, equipmentTypeId: eId }
          });
          const totalPurchases = purchaseAgg._sum.quantity || 0;

          const transferInAgg = await tx.transfer.aggregate({
            _sum: { quantity: true },
            where: { destinationBaseId: bId, equipmentTypeId: eId }
          });
          const totalTransferIn = transferInAgg._sum.quantity || 0;

          const transferOutAgg = await tx.transfer.aggregate({
            _sum: { quantity: true },
            where: { sourceBaseId: bId, equipmentTypeId: eId }
          });
          const totalTransferOut = transferOutAgg._sum.quantity || 0;

          const expenditureAgg = await tx.expenditure.aggregate({
            _sum: { quantity: true },
            where: { baseId: bId, equipmentTypeId: eId }
          });
          const totalExpenditures = expenditureAgg._sum.quantity || 0;

          const assignmentAgg = await tx.assignment.aggregate({
            _sum: { quantity: true },
            where: { baseId: bId, equipmentTypeId: eId, status: 'ACTIVE' }
          });
          const totalActiveAssignments = assignmentAgg._sum.quantity || 0;

          const availableBalance = totalPurchases + totalTransferIn - totalTransferOut - totalExpenditures - totalActiveAssignments;
          
          console.log({
            bId, eId,
            totalPurchases, totalTransferIn, totalTransferOut, totalExpenditures, totalActiveAssignments,
            availableBalance, parsedQuantity
          });

          if (availableBalance < parsedQuantity) {
            throw new InsufficientInventoryError(`Insufficient inventory at base. Available: ${availableBalance}`);
          }

          const assignment = await tx.assignment.create({
            data: {
              baseId: bId,
              equipmentTypeId: eId,
              quantity: parsedQuantity,
              personnelName,
              initiatedById: userId
            }
          });

          await tx.auditLog.create({
            data: {
              userId,
              action: 'ASSIGNMENT',
              details: `Assigned ${parsedQuantity} items (Type: ${eId}) to ${personnelName} at Base #${bId}`
            }
          });

          return assignment;
        }, {
          isolationLevel: 'Serializable'
        });
        
        break;
      } catch (error) {
        if (error.code === 'P2034' && retries < maxRetries - 1) {
          retries++;
          const delay = Math.random() * 50 * Math.pow(2, retries);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        throw error;
      }
    }

    res.status(201).json({ message: "Assignment created successfully", assignmentId: result.id });
  } catch (error) {
    next(error);
  }
};

export const returnAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignmentId = Number.parseInt(id, 10);
    const userId = req.user.id;

    const maxRetries = 3;
    let retries = 0;
    let result;

    while (retries < maxRetries) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const assignment = await tx.assignment.findUnique({
            where: { id: assignmentId }
          });

          if (!assignment) {
            throw new NotFoundError("Assignment not found");
          }

          if (assignment.status === 'RETURNED') {
            throw new InvalidAssignmentStateError("Assignment is already returned");
          }

          // Manual base scope check inside transaction because it's a URL param
          if (req.user.role === 'BASE_COMMANDER' && assignment.baseId !== req.user.baseId) {
            throw new AuthorizationError("Access Denied: Cross-base operations not allowed");
          }

          const updatedAssignment = await tx.assignment.update({
            where: { id: assignmentId },
            data: {
              status: 'RETURNED',
              returnedAt: new Date()
            }
          });

          await tx.auditLog.create({
            data: {
              userId,
              action: 'ASSIGNMENT_RETURN',
              details: `Returned assignment #${assignmentId} (${assignment.quantity} items) at Base #${assignment.baseId}`
            }
          });

          return updatedAssignment;
        }, {
          isolationLevel: 'Serializable'
        });
        
        break;
      } catch (error) {
        if (error.code === 'P2034' && retries < maxRetries - 1) {
          retries++;
          const delay = Math.random() * 50 * Math.pow(2, retries);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        throw error;
      }
    }

    res.status(200).json({ message: "Assignment returned successfully", assignmentId: result.id });
  } catch (error) {
    next(error);
  }
};

export const getAssignments = async (req, res, next) => {
  try {
    const { baseId } = req.query;
    const where = baseId ? { baseId: Number.parseInt(baseId, 10) } : {};
    
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        base: true,
        equipmentType: true,
        initiatedBy: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};
