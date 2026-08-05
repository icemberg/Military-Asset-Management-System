import prisma from '../config/db.js';
import { ValidationError } from '../utils/errors.js';

export const createPurchase = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, quantity } = req.body;
    const userId = req.user.id;

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new ValidationError("Quantity must be a positive integer");
    }

    const bId = Number.parseInt(baseId, 10);
    const eId = Number.parseInt(equipmentTypeId, 10);

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          baseId: bId,
          equipmentTypeId: eId,
          quantity: parsedQuantity
        }
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PURCHASE',
          details: `Purchased ${parsedQuantity} items (Type: ${eId}) for Base #${bId}`
        }
      });

      return purchase;
    });

    res.status(201).json({ message: "Purchase recorded successfully", purchaseId: result.id });
  } catch (error) {
    next(error);
  }
};

export const getPurchases = async (req, res, next) => {
  try {
    const { baseId } = req.query;
    const where = baseId ? { baseId: Number.parseInt(baseId, 10) } : {};
    
    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        base: true,
        equipmentType: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(purchases);
  } catch (error) {
    next(error);
  }
};
