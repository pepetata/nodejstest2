const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'alacarte_dev',
  password: 'password',
  port: 5432,
});

async function updateOperatingHours() {
  try {
    console.log('Updating operating hours to include holidays...');

    // Get all locations
    const result = await pool.query('SELECT id, name, operating_hours FROM restaurant_locations');
    console.log('Found locations:', result.rows.length);

    for (const location of result.rows) {
      let operatingHours;

      // Parse existing operating_hours
      if (typeof location.operating_hours === 'string') {
        operatingHours = JSON.parse(location.operating_hours);
      } else {
        operatingHours = location.operating_hours || {};
      }

      // Add holidays if not present
      if (!operatingHours.holidays) {
        operatingHours.holidays = {
          open: '00:00',
          close: '00:00',
          closed: true,
        };

        // Update the location
        await pool.query('UPDATE restaurant_locations SET operating_hours = $1 WHERE id = $2', [
          JSON.stringify(operatingHours),
          location.id,
        ]);

        console.log('Updated location:', location.name);
      }
    }

    console.log('All locations updated successfully!');
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

updateOperatingHours();
