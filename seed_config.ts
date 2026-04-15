import { prisma } from './src/lib/prisma';

async function seed() {
  await prisma.systemConfig.upsert({
    where: { key: "URGENT_REQUEST_FEE" },
    update: {},
    create: { key: "URGENT_REQUEST_FEE", value: "3000", description: "긴급 견적 요청 시 결제하는 수수료" }
  });
  await prisma.systemConfig.upsert({
    where: { key: "BASIC_SUBSCRIPTION_FEE" },
    update: {},
    create: { key: "BASIC_SUBSCRIPTION_FEE", value: "11000", description: "전문가 매월 결제 Basic 구독 비용" }
  });
  console.log("Seeding complete.");
  process.exit(0);
}
seed();
