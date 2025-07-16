const db = require('./src/config/db');

async function checkPadre2Restaurant() {
  try {
    const result = await db.query('SELECT * FROM restaurants WHERE url = $1', ['padre2']);
    console.log('Restaurant padre2:', result.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkPadre2Restaurant();
