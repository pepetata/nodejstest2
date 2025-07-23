const db = require('./src/config/db');

async function checkRestaurantIds() {
  try {
    const result = await db.query('SELECT id, name FROM restaurants LIMIT 5');
    console.log('Restaurant IDs and types:');
    result.rows.forEach((r) => {
      console.log(`- ID: ${r.id} (type: ${typeof r.id}), Name: ${r.name}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkRestaurantIds();
