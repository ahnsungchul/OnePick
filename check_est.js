const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:5432/onedeal_db?schema=public');
client.connect()
  .then(() => client.query(`SELECT e.id as est_id, u.id as user_id, u.name as user_name FROM "Estimate" e LEFT JOIN users u ON e."customerId" = u.id LIMIT 5`))
  .then(res => console.log(res.rows))
  .catch(console.error)
  .finally(() => client.end());
