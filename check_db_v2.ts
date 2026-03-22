
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const tableCount = await prisma.bidItem.count();
    console.log('BidItem table exists. Count:', tableCount);
    console.log('DB connection successful.');
  } catch (error) {
    console.error('Diagnostic failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
