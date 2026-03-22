import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function test() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Checking database columns for "users"...');
    const columns: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `;
    console.log('Columns in "users":', columns.map(c => `${c.column_name} (${c.data_type})`));
    
    const hasSpecialties = columns.some(c => c.column_name === 'specialties');
    console.log('Has specialties column:', hasSpecialties);

    if (hasSpecialties) {
      console.log('Attempting to update specialties for a test user...');
      // Just check if we can query it
      const users = await prisma.user.findMany({ take: 1 });
      if (users.length > 0) {
        console.log('Test user ID:', users[0].id);
        try {
          const updated = await (prisma.user as any).update({
            where: { id: users[0].id },
            data: { specialties: { set: ['Test'] } }
          });
          console.log('Update successful:', updated.specialties);
        } catch (e: any) {
          console.error('Update failed with error:', e.message);
        }
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
