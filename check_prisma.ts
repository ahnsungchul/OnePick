import prisma from './src/lib/prisma';

async function checkPrisma() {
  console.log("Checking Prisma models...");
  const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
  console.log("Available models:", models);
  
  if (models.includes('inquiry')) {
    console.log("✅ 'inquiry' model exists.");
  } else {
    console.log("❌ 'inquiry' model is MISSING.");
  }

  if (models.includes('report')) {
    console.log("✅ 'report' model exists.");
  } else {
    console.log("❌ 'report' model is MISSING.");
  }
}

checkPrisma().catch(console.error);
