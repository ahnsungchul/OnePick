import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const { prisma } = await import('./src/lib/prisma');
  console.log('Starting certification migration...');
  
  // Find users with certificationUrls
  const users = await prisma.user.findMany({
    where: {
      NOT: {
        certificationUrls: { equals: [] },
      },
      // Array length check natively is hard, but usually NOT equals [] is enough
    },
    select: {
      id: true,
      certificationUrls: true,
      certificationApproved: true,
    }
  });

  console.log(`Found ${users.length} users to migrate.`);
  
  let totalCreated = 0;

  for (const user of users) {
    if (!user.certificationUrls || user.certificationUrls.length === 0) continue;
    
    // Check if the user already has any created certification records
    const existingCerts = await prisma.certification.count({ where: { userId: user.id }});
    if (existingCerts > 0) {
      console.log(`User ${user.id} already has certifications migrated. Skipping.`);
      continue;
    }

    for (const url of user.certificationUrls) {
      // Just map name to url
      await prisma.certification.create({
        data: {
          userId: user.id,
          name: url,
          isApproved: user.certificationApproved,
          fileUrl: null,
        }
      });
      totalCreated++;
    }
  }

  console.log(`Successfully created ${totalCreated} certification records.`);
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
