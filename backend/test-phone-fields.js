// Test script to verify phone fields are being saved
// Run: node test-phone-fields.js

// Set correct DB credentials
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'admin';
process.env.DB_NAME = 'alacarte_dev';

const db = require('./src/config/db');

async function testPhoneFields() {
  try {
    // Check if phone fields exist in users table
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('phone', 'whatsapp')
      ORDER BY column_name;
    `;

    const schemaResult = await db.query(schemaQuery);
    console.log('=== Phone field schema ===');
    console.log(schemaResult.rows);

    // Check if any users have phone data
    const dataQuery = `
      SELECT id, full_name, phone, whatsapp, created_at
      FROM users
      WHERE phone IS NOT NULL OR whatsapp IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5;
    `;

    const dataResult = await db.query(dataQuery);
    console.log('\n=== Users with phone data ===');
    console.log(dataResult.rows);

    // Check total users count
    const countQuery = `SELECT COUNT(*) as total FROM users;`;
    const countResult = await db.query(countQuery);
    console.log('\n=== Total users ===');
    console.log(countResult.rows[0]);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testPhoneFields();
