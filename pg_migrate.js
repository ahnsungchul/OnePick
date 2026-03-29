const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/onedeal_db?schema=public' });

async function main() {
  await client.connect();
  const res = await client.query('UPDATE users SET "idCardApproved" = true, "businessLicenseApproved" = true WHERE "isApproved" = true');
  console.log(`Migrated ${res.rowCount} rows.`);
  await client.end();
}

main().catch(console.error);
