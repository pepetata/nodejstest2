const db = require('./src/config/db');

async function checkRestaurantSchema() {
  try {
    // Check restaurant table schema
    const schema = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'restaurants'
      ORDER BY ordinal_position
    `);

    console.log('Restaurants table columns:');
    schema.rows.forEach((row) => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // Get sample data
    console.log('\nSample restaurant data:');
    const data = await db.query('SELECT * FROM restaurants LIMIT 3');
    data.rows.forEach((row, index) => {
      console.log(`Restaurant ${index + 1}:`);
      Object.keys(row).forEach((key) => {
        console.log(`  ${key}: ${row[key]} (${typeof row[key]})`);
      });
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkRestaurantSchema();
