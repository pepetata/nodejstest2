require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'alacarte_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function checkLanguagesTable() {
  try {
    console.log('Checking languages table structure...');

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'languages'
      ORDER BY ordinal_position
    `);

    if (result.rows.length === 0) {
      console.log('Languages table does not exist!');
    } else {
      console.log('\nLanguages table columns:');
      result.rows.forEach((row) => {
        console.log(
          `- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`
        );
      });
    }

    console.log('\nChecking if languages table has any data...');
    const dataResult = await pool.query('SELECT * FROM languages LIMIT 5');
    console.log(`Found ${dataResult.rows.length} rows in languages table`);
    if (dataResult.rows.length > 0) {
      console.log('Sample data:', dataResult.rows);
    }
  } catch (error) {
    console.error('Error checking languages table:', error.message);
  } finally {
    await pool.end();
  }
}

checkLanguagesTable();
