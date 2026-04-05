const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
   const ports = await prisma.portfolio.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1
   });
   if (ports.length > 0) {
      console.log(ports[0].blogUrl);
   }
}
main().catch(console.error).finally(() => prisma.$disconnect());
