import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await prisma.schedule.create({
      data: {
        expertId: 2, // Assuming valid id. Wait I will just use any existing id. Let's find one.
        date: "2026-04-11",
        title: "Test Schedule",
        content: "",
        isHoliday: false,
        amount: 50000,
      }
    });
    console.log("Success:", res);
  } catch (error: any) {
    console.error("Custom Schedule Error:", error.message);
  }
}
run().finally(() => prisma.$disconnect());
