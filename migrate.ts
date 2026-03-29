import { PrismaClient } from './src/generated/prisma';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration...');
  const result = await prisma.user.updateMany({
    where: { isApproved: true },
    data: {
      idCardApproved: true,
      businessLicenseApproved: true,
    }
  });
  console.log(`Successfully migrated ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
