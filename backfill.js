import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const estimates = await prisma.estimate.findMany({
    where: { requestNumber: null }
  });

  console.log(`Found ${estimates.length} estimates without a request number.`);

  for (const e of estimates) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
    const num = Math.floor(1000 + Math.random() * 9000);
    const requestNumber = `${l1}${l2}${num}`;

    await prisma.estimate.update({
      where: { id: e.id },
      data: { requestNumber }
    });
    console.log(`Updated ${e.id} with ${requestNumber}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
