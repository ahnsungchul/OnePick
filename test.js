const { PrismaClient } = require('./src/generated/prisma');

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst();
    if (!user) return console.error('No user found');
    
    console.log("Will create schedule for user", user.id);
    const s = await prisma.schedule.create({
      data: {
        expertId: user.id,
        date: '2026-04-11',
        title: 'test',
        content: '',
        isHoliday: false,
        amount: 0
      }
    });
    console.log("Created", s);
  } catch (e) {
    console.error("Failed", e);
  } finally {
    prisma.$disconnect();
  }
}
main();
