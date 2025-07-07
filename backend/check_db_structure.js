require('dotenv').config();

const dbName = process.env.DB_NAME || 'alacarte_test';
process.env.DB_NAME = dbName;

const db = require('./src/config/db');

(async () => {
  try {
    console.log(`\n=== Checking database: ${dbName} ===\n`);

    console.log('Restaurants table structure:');
    const restaurantInfo = await db.query(`
      SELECT column_name, data_type, character_maximum_length, column_default
      FROM information_schema.columns
      WHERE table_name = 'restaurants'
      ORDER BY ordinal_position;
    `);
    console.log('Restaurant Columns:', restaurantInfo.rows.length);
    restaurantInfo.rows.forEach((row) => {
      console.log(
        `  ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`
      );
    });

    console.log('\nRestaurants Check constraints:');
    const constraints = await db.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'restaurants'::regclass AND contype = 'c';
    `);
    constraints.rows.forEach((row) => {
      console.log(`  ${row.conname}: ${row.definition}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.closePool();
  }
})();
