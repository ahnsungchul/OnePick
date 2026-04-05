const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
   const ports = await prisma.portfolio.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
   });
   ports.forEach(p => console.log(`ID: ${p.id}, BlogUrl: ${p.blogUrl}, Created: ${p.createdAt}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
