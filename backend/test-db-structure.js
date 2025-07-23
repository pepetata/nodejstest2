const db = require('./src/config/db');

async function testDB() {
  try {
    const result = await db.query('SELECT 1');
    console.log('Database connection: OK');

    // Test languages query
    const languages = await db.query('SELECT * FROM languages LIMIT 3');
    console.log('Languages table:', languages.rows);

    // Test if restaurant_languages table exists
    const tableCheck = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'restaurant_languages'
      ORDER BY ordinal_position
    `);
    console.log('restaurant_languages table structure:', tableCheck.rows);

    // Test the language API routes
    console.log('Database tests completed');
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

testDB()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
