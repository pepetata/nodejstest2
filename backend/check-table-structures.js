require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'alacarte_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function checkTables() {
  try {
    console.log('Checking menu_categories table structure...');

    const categoriesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'menu_categories'
      ORDER BY ordinal_position
    `);

    if (categoriesResult.rows.length === 0) {
      console.log('Menu_categories table does not exist!');
    } else {
      console.log('\nMenu_categories table columns:');
      categoriesResult.rows.forEach((row) => {
        console.log(
          `- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`
        );
      });
    }

    console.log('\nChecking restaurants table structure...');

    const restaurantsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'restaurants'
      ORDER BY ordinal_position
    `);

    if (restaurantsResult.rows.length === 0) {
      console.log('Restaurants table does not exist!');
    } else {
      console.log('\nRestaurants table columns:');
      restaurantsResult.rows.forEach((row) => {
        console.log(
          `- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`
        );
      });
    }
  } catch (error) {
    console.error('Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
