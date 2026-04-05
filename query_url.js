const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
    const portfolios = await prisma.portfolio.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    console.log("RECENT PORTFOLIOS:");
    portfolios.forEach(p => console.log(p.blogUrl));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
