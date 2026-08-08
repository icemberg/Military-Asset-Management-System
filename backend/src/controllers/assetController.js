import prisma from '../config/db.js';

const buildWhereClause = (baseFilter, typeFilter, dateFilter, extraConditions = {}) => ({
  ...(baseFilter && { ...extraConditions.base }),
  ...(typeFilter && { equipmentTypeId: typeFilter }),
  ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
  ...(extraConditions.other || {})
});

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;

    const baseFilter = baseId ? Number.parseInt(baseId, 10) : undefined;
    const typeFilter = equipmentTypeId ? Number.parseInt(equipmentTypeId, 10) : undefined;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const purchaseAggregate = await prisma.purchase.aggregate({
      _sum: { quantity: true },
      where: buildWhereClause(baseFilter, typeFilter, dateFilter, { base: { baseId: baseFilter } })
    });

    const transferInAggregate = await prisma.transfer.aggregate({
      _sum: { quantity: true },
      where: buildWhereClause(baseFilter, typeFilter, dateFilter, { base: { destinationBaseId: baseFilter } })
    });

    const transferOutAggregate = await prisma.transfer.aggregate({
      _sum: { quantity: true },
      where: buildWhereClause(baseFilter, typeFilter, dateFilter, { base: { sourceBaseId: baseFilter } })
    });

    const expenditureAggregate = await prisma.expenditure.aggregate({
      _sum: { quantity: true },
      where: buildWhereClause(baseFilter, typeFilter, dateFilter, { base: { baseId: baseFilter } })
    });

    const assignmentAggregate = await prisma.assignment.aggregate({
      _sum: { quantity: true },
      where: buildWhereClause(baseFilter, typeFilter, dateFilter, { 
        base: { baseId: baseFilter },
        other: { status: 'ACTIVE' }
      })
    });

    const totalPurchases = purchaseAggregate._sum.quantity || 0;
    const totalTransferIn = transferInAggregate._sum.quantity || 0;
    const totalTransferOut = transferOutAggregate._sum.quantity || 0;
    const totalExpended = expenditureAggregate._sum.quantity || 0;
    const totalAssigned = assignmentAggregate._sum.quantity || 0;

    const netMovement = totalPurchases + totalTransferIn - totalTransferOut;
    const openingBalance = 0; 
    
    // Per the test case DASH-01 and physical reality:
    // Closing Balance includes physical items at the base, meaning assigned items are still counted.
    const closingBalance = openingBalance + netMovement - totalExpended;
    const availableStock = closingBalance - totalAssigned;

    res.json({
      openingBalance,
      purchases: totalPurchases,
      transfersIn: totalTransferIn,
      transfersOut: totalTransferOut,
      expended: totalExpended,
      assigned: totalAssigned,
      netMovement,
      closingBalance,
      availableStock
    });
  } catch (error) {
    next(error);
  }
};

export const getBases = async (req, res, next) => {
  try {
    const bases = await prisma.base.findMany();
    res.json(bases);
  } catch (error) {
    next(error);
  }
};

export const getEquipmentTypes = async (req, res, next) => {
  try {
    const equipmentTypes = await prisma.equipmentType.findMany();
    res.json(equipmentTypes);
  } catch (error) {
    next(error);
  }
};
