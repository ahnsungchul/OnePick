const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:5432/onedeal_db?schema=public');

async function revert() {
  await client.connect();
  
  // Re-assign all estimates randomly to the original 3 users (1, 2, 3)
  const estRes = await client.query('SELECT id FROM "Estimate"');
  const orgUsers = [1, 2, 3];
  
  for(let row of estRes.rows) {
    const user = orgUsers[Math.floor(Math.random() * orgUsers.length)];
    await client.query('UPDATE "Estimate" SET "customerId" = $1 WHERE id = $2', [user, row.id]);
  }
  
  // Rename user 1 back to "더미 사용자"
  await client.query('UPDATE users SET name = $1 WHERE id = 1', ['더미 사용자']);
  
  // Delete the fake users
  await client.query('DELETE FROM users WHERE id > 3');
  
  await client.end();
  console.log('Reverted to original users');
}
revert().catch(console.error);
