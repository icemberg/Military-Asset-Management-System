import prisma from '../config/db.js';
import { 
  InsufficientInventoryError, 
  ValidationError
} from '../utils/errors.js';

export const createExpenditure = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, quantity, reason } = req.body;
    const userId = req.user.id;

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new ValidationError("Quantity must be a positive integer");
    }
    if (!reason || typeof reason !== 'string') {
      throw new ValidationError("Reason is required");
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

          if (availableBalance < parsedQuantity) {
            throw new InsufficientInventoryError(`Insufficient inventory at base. Available: ${availableBalance}`);
          }

          const expenditure = await tx.expenditure.create({
            data: {
              baseId: bId,
              equipmentTypeId: eId,
              quantity: parsedQuantity,
              reason,
              initiatedById: userId
            }
          });

          await tx.auditLog.create({
            data: {
              userId,
              action: 'EXPENDITURE',
              details: `Expended ${parsedQuantity} items (Type: ${eId}) at Base #${bId}. Reason: ${reason}`
            }
          });

          return expenditure;
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

    res.status(201).json({ message: "Expenditure created successfully", expenditureId: result.id });
  } catch (error) {
    next(error);
  }
};

export const getExpenditures = async (req, res, next) => {
  try {
    const { baseId } = req.query;
    const where = baseId ? { baseId: Number.parseInt(baseId, 10) } : {};
    
    const expenditures = await prisma.expenditure.findMany({
      where,
      include: {
        base: true,
        equipmentType: true,
        initiatedBy: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(expenditures);
  } catch (error) {
    next(error);
  }
};
