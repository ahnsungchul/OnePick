const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: 'EXPERT', subscriptionPlan: 'BASIC' },
  });
  console.log("BASIC user:", user?.id);
  const user2 = await prisma.user.findFirst({
    where: { role: 'EXPERT' },
    select: { id: true, subscriptionPlan: true }
  });
  console.log("First expert:", user2);
}
main().finally(() => prisma.$disconnect());
