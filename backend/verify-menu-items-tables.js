require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'alacarte_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function verifyTables() {
  try {
    const tables = ['menu_items', 'menu_item_translations', 'menu_item_categories'];

    for (const table of tables) {
      console.log(`\n=== ${table.toUpperCase()} TABLE ===`);

      const result = await pool.query(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `,
        [table]
      );

      if (result.rows.length === 0) {
        console.log(`❌ ${table} table does not exist!`);
      } else {
        console.log(`✅ ${table} table created successfully with ${result.rows.length} columns:`);
        result.rows.forEach((row) => {
          console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
      }
    }

    // Check indexes
    console.log('\n=== INDEXES ===');
    const indexResult = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename IN ('menu_items', 'menu_item_translations', 'menu_item_categories')
      ORDER BY tablename, indexname
    `);

    console.log(`✅ Found ${indexResult.rows.length} indexes:`);
    indexResult.rows.forEach((row) => {
      console.log(`  - ${row.indexname} on ${row.tablename}`);
    });
  } catch (error) {
    console.error('Error verifying tables:', error.message);
  } finally {
    await pool.end();
  }
}

verifyTables();
