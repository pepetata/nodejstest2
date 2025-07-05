const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkPassword() {
  console.log('Generating new hash for pizza123...');
  const newHash = await bcrypt.hash('pizza123', 12);
  console.log('New hash for pizza123:', newHash);

  // Test the new hash
  const isValid = await bcrypt.compare('pizza123', newHash);
  console.log('New hash validates:', isValid);

  // Update the database
  const testPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'alacarte_test',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
  });

  console.log('Updating password in database...');
  await testPool.query('UPDATE restaurants SET password = $1 WHERE email = $2', [
    newHash,
    'joao@pizzariabella.com.br',
  ]);

  // Verify update
  const result = await testPool.query('SELECT email, password FROM restaurants WHERE email = $1', [
    'joao@pizzariabella.com.br',
  ]);
  console.log('Updated password hash:', result.rows[0].password);

  // Test the updated hash
  const finalTest = await bcrypt.compare('pizza123', result.rows[0].password);
  console.log('Final test - pizza123 validates:', finalTest);

  await testPool.end();
}

checkPassword().catch(console.error);
