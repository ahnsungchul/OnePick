const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:5432/onedeal_db?schema=public');

const names = ['김지훈', '이수아', '박민준', '최유진', '정현우', '강동호', '윤지은', '홍길동', '이민수', '박수진'];

async function update() {
  await client.connect();
  const res = await client.query('SELECT id FROM "Estimate"');
  const estIds = res.rows.map(r => r.id);
  
  // Create realistic users
  let userIds = [];
  for(let name of names) {
    const res = await client.query('INSERT INTO users (email, name, role, "updatedAt") VALUES ($1, $2, $3, NOW()) RETURNING id', [`${Date.now()}_${name}@example.com`, name, 'USER']);
    userIds.push(res.rows[0].id);
  }
  
  // Randomly assign the users to existing Estimates
  for(let estId of estIds) {
    const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
    await client.query('UPDATE "Estimate" SET "customerId" = $1 WHERE id = $2', [randomUserId, estId]);
  }
  
  await client.query('UPDATE users SET name = $1 WHERE id = 1', ['전기요']); // update old dummy user too
  
  await client.end();
  console.log('Update finished');
}
update().catch(console.error);
