const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("Estimate model fields (from dmmf):");
    const model = prisma._dmmf.modelMap.Estimate;
    if (!model) {
      console.log("Model Estimate not found!");
    } else {
      console.log(model.fields.map(f => f.name).join(", "));
    }
  } catch (err) {
    console.error("Failed to inspect dmmf:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
