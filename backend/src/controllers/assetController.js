import prisma from '../config/db.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;

    const baseFilter = baseId ? parseInt(baseId) : undefined;
    const typeFilter = equipmentTypeId ? parseInt(equipmentTypeId) : undefined;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const purchaseAggregate = await prisma.purchase.aggregate({
      _sum: { quantity: true },
      where: {
        ...(baseFilter && { baseId: baseFilter }),
        ...(typeFilter && { equipmentTypeId: typeFilter }),
        ...(hasDateFilter && { createdAt: dateFilter })
      }
    });

    const transferInAggregate = await prisma.transfer.aggregate({
      _sum: { quantity: true },
      where: {
        ...(baseFilter && { destinationBaseId: baseFilter }),
        ...(typeFilter && { equipmentTypeId: typeFilter }),
        ...(hasDateFilter && { createdAt: dateFilter })
      }
    });

    const transferOutAggregate = await prisma.transfer.aggregate({
      _sum: { quantity: true },
      where: {
        ...(baseFilter && { sourceBaseId: baseFilter }),
        ...(typeFilter && { equipmentTypeId: typeFilter }),
        ...(hasDateFilter && { createdAt: dateFilter })
      }
    });

    const totalPurchases = purchaseAggregate._sum.quantity || 0;
    const totalTransferIn = transferInAggregate._sum.quantity || 0;
    const totalTransferOut = transferOutAggregate._sum.quantity || 0;

    const netMovement = totalPurchases + totalTransferIn - totalTransferOut;
    const openingBalance = 0; 
    const closingBalance = openingBalance + netMovement;

    res.json({
      openingBalance,
      purchases: totalPurchases,
      transfersIn: totalTransferIn,
      transfersOut: totalTransferOut,
      netMovement,
      closingBalance
    });
  } catch (error) {
    next(error);
  }
};
