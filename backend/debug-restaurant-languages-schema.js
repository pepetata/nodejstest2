const db = require('./src/config/db');

async function checkRestaurantLanguagesSchema() {
  try {
    // Check restaurant_languages table schema
    const schema = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'restaurant_languages'
      ORDER BY ordinal_position
    `);

    console.log('Restaurant_languages table columns:');
    schema.rows.forEach((row) => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // Check if there's any sample data
    console.log('\nSample restaurant_languages data:');
    const data = await db.query('SELECT * FROM restaurant_languages LIMIT 3');
    if (data.rows.length > 0) {
      data.rows.forEach((row, index) => {
        console.log(`Record ${index + 1}:`);
        Object.keys(row).forEach((key) => {
          console.log(`  ${key}: ${row[key]} (${typeof row[key]})`);
        });
        console.log('');
      });
    } else {
      console.log('No data found in restaurant_languages table');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkRestaurantLanguagesSchema();
