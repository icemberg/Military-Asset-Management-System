import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function countRows() {
  const count = await prisma.expenditure.count({
    where: {
      reason: {
        contains: 'Lifecycle Test'
      }
    }
  });
  console.log(`Expenditure rows with 'Lifecycle Test': ${count}`);
}

countRows().finally(() => prisma.$disconnect());
