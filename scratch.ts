import 'dotenv/config';
import { prisma } from './src/lib/prisma';
async function main() {
  const estimate = await prisma.estimate.findUnique({
    where: { requestNumber: '202604BQ315' },
    include: {
      bids: true
    }
  });
  console.log(JSON.stringify(estimate, null, 2));
}
main().finally(() => {});
