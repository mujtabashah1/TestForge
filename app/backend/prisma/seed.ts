import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash('TestForge123!', 12);

await prisma.user.upsert({
  where: { email: 'admin@testforge.local' },
  update: {},
  create: { email: 'admin@testforge.local', name: 'TestForge Admin', role: 'ADMIN', passwordHash },
});
await prisma.user.upsert({
  where: { email: 'customer@testforge.local' },
  update: {},
  create: {
    email: 'customer@testforge.local',
    name: 'Demo Customer',
    role: 'CUSTOMER',
    passwordHash,
  },
});
for (const product of [
  {
    sku: 'TF-LAPTOP-001',
    name: 'ForgeBook Pro',
    description: 'High-performance developer laptop',
    priceCents: 159900,
    inventory: 12,
    category: 'Computers',
  },
  {
    sku: 'TF-KEYBOARD-001',
    name: 'Ember Mechanical Keyboard',
    description: 'Hot-swappable mechanical keyboard',
    priceCents: 12900,
    inventory: 30,
    category: 'Accessories',
  },
  {
    sku: 'TF-MONITOR-001',
    name: 'Anvil 27-inch Monitor',
    description: 'Color-accurate QHD display',
    priceCents: 34900,
    inventory: 18,
    category: 'Displays',
  },
]) {
  await prisma.product.upsert({ where: { sku: product.sku }, update: product, create: product });
}
await prisma.$disconnect();
console.log('Deterministic seed complete');
