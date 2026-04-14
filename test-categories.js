const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log("Categories in DB:", categories.length);
  if (categories.length > 0) {
    console.log(categories.map(c => c.name));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
