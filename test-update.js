const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst({
        where: { role: 'EXPERT' }
    });
    if (!user) return console.log("No expert user found");
    
    console.log("Before:", user.businessLicenseUrls);
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        businessLicenseUrls: { set: ["test-license.jpg"] }
      }
    });
    console.log("After (using set):", updated.businessLicenseUrls);

    const updated2 = await prisma.user.update({
        where: { id: user.id },
        data: {
          businessLicenseUrls: ["test2-license.jpg"]
        }
    });
    console.log("After (direct array):", updated2.businessLicenseUrls);

  } catch (e) {
    console.error("Error setting array:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
