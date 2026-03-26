import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

import prisma from './src/lib/prisma';

async function main() {
  const estimate = await prisma.estimate.findFirst({
    where: { requestNumber: '2026GR79' },
    include: {
      bids: true
    }
  });

  console.log(JSON.stringify(estimate, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
