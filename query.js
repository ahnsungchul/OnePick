const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const estimate = await prisma.estimate.findFirst({
    where: { requestNumber: '2026GR79' },
    include: { bids: true }
  });
  console.log(JSON.stringify(estimate, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
