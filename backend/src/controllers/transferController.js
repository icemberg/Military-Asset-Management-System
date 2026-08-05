import prisma from '../config/db.js';
import { 
  InsufficientInventoryError, 
  SameBaseTransferError, 
  ValidationError 
} from '../utils/errors.js';

export const createTransfer = async (req, res, next) => {
  try {
    const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity } = req.body;
    const userId = req.user.id;

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new ValidationError("Quantity must be a positive integer");
    }

    const sId = Number.parseInt(sourceBaseId, 10);
    const dId = Number.parseInt(destinationBaseId, 10);
    const eId = Number.parseInt(equipmentTypeId, 10);

    if (sId === dId) {
      throw new SameBaseTransferError();
    }

    const maxRetries = 3;
    let retries = 0;
    let result;

    while (retries < maxRetries) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const purchaseAgg = await tx.purchase.aggregate({
            _sum: { quantity: true },
            where: { baseId: sId, equipmentTypeId: eId }
          });
          const totalPurchases = purchaseAgg._sum.quantity || 0;

          const transferInAgg = await tx.transfer.aggregate({
            _sum: { quantity: true },
            where: { destinationBaseId: sId, equipmentTypeId: eId }
          });
          const totalTransferIn = transferInAgg._sum.quantity || 0;

          const transferOutAgg = await tx.transfer.aggregate({
            _sum: { quantity: true },
            where: { sourceBaseId: sId, equipmentTypeId: eId }
          });
          const totalTransferOut = transferOutAgg._sum.quantity || 0;

          const availableBalance = totalPurchases + totalTransferIn - totalTransferOut;

          if (availableBalance < parsedQuantity) {
            throw new InsufficientInventoryError(`Insufficient inventory at source base. Available: ${availableBalance}`);
          }

          const transfer = await tx.transfer.create({
            data: {
              sourceBaseId: sId,
              destinationBaseId: dId,
              equipmentTypeId: eId,
              quantity: parsedQuantity,
              initiatedById: userId
            }
          });

          await tx.auditLog.create({
            data: {
              userId,
              action: 'TRANSFER',
              details: `Transferred ${parsedQuantity} items (Type: ${eId}) from Base #${sId} to Base #${dId}`
            }
          });

          return transfer;
        }, {
          isolationLevel: 'Serializable'
        });
        
        break;
      } catch (error) {
        if (error.code === 'P2034' && retries < maxRetries - 1) {
          retries++;
          // eslint-disable-next-line
          const delay = Math.random() * 50 * Math.pow(2, retries);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        throw error;
      }
    }

    res.status(201).json({ message: "Transfer completed successfully", transferId: result.id });
  } catch (error) {
    next(error);
  }
};

export const getTransfers = async (req, res, next) => {
  try {
    const { baseId } = req.query;
    const where = baseId ? {
      OR: [
        { sourceBaseId: Number.parseInt(baseId, 10) },
        { destinationBaseId: Number.parseInt(baseId, 10) }
      ]
    } : {};
    
    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        sourceBase: true,
        destinationBase: true,
        equipmentType: true,
        initiatedBy: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transfers);
  } catch (error) {
    next(error);
  }
};
