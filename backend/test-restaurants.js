const db = require('./src/config/db');

async function checkRestaurants() {
  try {
    const result = await db.query('SELECT * FROM restaurants WHERE url LIKE $1', ['%padre%']);
    console.log('Restaurants with "padre" in URL:');
    console.log(result.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkRestaurants();
