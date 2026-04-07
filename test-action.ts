import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const cnt = await prisma.user.count();
  console.log("Users:", cnt);
}
check();
