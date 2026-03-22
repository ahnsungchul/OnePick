import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("Estimate model fields (from dmmf):");
    // @ts-ignore
    const fields = prisma._dmmf.modelMap.Estimate.fields;
    console.log(fields.map((f: any) => f.name).join(", "));
  } catch (err) {
    console.error("Failed to inspect dmmf:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
