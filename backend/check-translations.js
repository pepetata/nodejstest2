const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'alacarte_dev',
  password: 'admin',
  port: 5432,
});

async function checkTranslationTables() {
  try {
    // Check menu categories table
    console.log('=== MENU CATEGORIES TABLE ===');
    const categoriesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'menu_categories'
      ORDER BY ordinal_position
    `);
    console.log('Columns:', categoriesColumns.rows);

    // Check if menu category translations table exists
    console.log('\n=== MENU CATEGORY TRANSLATIONS TABLE ===');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'menu_category_translations'
      );
    `);

    console.log('Menu category translations table exists:', tableExists.rows[0].exists);

    if (tableExists.rows[0].exists) {
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'menu_category_translations'
        ORDER BY ordinal_position
      `);
      console.log('Columns:', columns.rows);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTranslationTables();
