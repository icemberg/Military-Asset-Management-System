import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Use findFirst since name doesn't have a unique constraint
  let base1 = await prisma.base.findFirst({ where: { name: 'Fort Alpha' } });
  if (!base1) {
    base1 = await prisma.base.create({
      data: { name: 'Fort Alpha', location: 'Base #1' }
    });
  }

  // Credentials:
  // Username: admin_user
  // Password: AdminPass123!
  const adminHash = await bcrypt.hash('AdminPass123!', 10);
  await prisma.user.upsert({
    where: { username: 'admin_user' },
    update: {},
    create: {
      username: 'admin_user',
      passwordHash: adminHash,
      role: 'ADMIN'
    }
  });

  // Credentials:
  // Username: commander_alpha
  // Password: CommandPass123!
  const commanderHash = await bcrypt.hash('CommandPass123!', 10);
  await prisma.user.upsert({
    where: { username: 'commander_alpha' },
    update: {},
    create: {
      username: 'commander_alpha',
      passwordHash: commanderHash,
      role: 'BASE_COMMANDER',
      baseId: base1.id
    }
  });

  let base2 = await prisma.base.findFirst({ where: { name: 'Fort Bravo' } });
  if (!base2) {
    base2 = await prisma.base.create({
      data: { name: 'Fort Bravo', location: 'Base #2' }
    });
  }

  // Credentials:
  // Username: commander_bravo
  // Password: CommandPassBravo!
  const commanderBravoHash = await bcrypt.hash('CommandPassBravo!', 10);
  await prisma.user.upsert({
    where: { username: 'commander_bravo' },
    update: {},
    create: {
      username: 'commander_bravo',
      passwordHash: commanderBravoHash,
      role: 'BASE_COMMANDER',
      baseId: base2.id
    }
  });

  // Credentials:
  // Username: logistics_officer
  // Password: LogisticsPass123!
  const logisticsHash = await bcrypt.hash('LogisticsPass123!', 10);
  await prisma.user.upsert({
    where: { username: 'logistics_officer' },
    update: {},
    create: {
      username: 'logistics_officer',
      passwordHash: logisticsHash,
      role: 'LOGISTICS_OFFICER',
      baseId: base1.id
    }
  });

  let equipment1 = await prisma.equipmentType.findFirst({ where: { name: 'M4 Carbine' } });
  if (!equipment1) {
    await prisma.equipmentType.create({
      data: { name: 'M4 Carbine', category: 'WEAPON' }
    });
  }

  console.log('Database seeded with requested credentials!');
}

try {
  await main();
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
