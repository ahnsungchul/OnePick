"use server";

import prisma from "@/lib/prisma";

export async function checkDatabaseSchemaAction() {
  try {
    // Check if the column exists in the users table
    const columns: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'specialties';
    `;
    
    // Check the current User model fields at runtime if possible
    const modelMetadata = (prisma as any)._runtimeDataModel?.models?.User?.fields;

    return { 
      success: true, 
      dbColumns: columns,
      runtimeFields: modelMetadata ? Object.keys(modelMetadata) : 'Unable to fetch runtime fields'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
