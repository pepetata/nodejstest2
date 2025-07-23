const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'restaurants_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function checkConstraint() {
  try {
    // Check the constraint definition
    const constraintQuery = `
      SELECT
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conname = 'idx_restaurant_languages_single_default';
    `;

    const constraintResult = await pool.query(constraintQuery);
    console.log('Constraint definition:', constraintResult.rows);

    // Check table structure
    const tableQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'restaurant_languages'
      ORDER BY ordinal_position;
    `;

    const tableResult = await pool.query(tableQuery);
    console.log('Table structure:', tableResult.rows);

    // Check current data
    const dataQuery = `
      SELECT restaurant_id, language_id, is_default, is_active, created_at, updated_at
      FROM restaurant_languages
      WHERE restaurant_id = 'c7742866-f77b-4f68-8586-57d631af301a'
      ORDER BY created_at DESC;
    `;

    const dataResult = await pool.query(dataQuery);
    console.log('Current data:', dataResult.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkConstraint();
