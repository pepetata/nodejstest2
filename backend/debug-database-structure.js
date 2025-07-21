// Check database tables and locations
require('dotenv').config();
const { Pool } = require('pg');

async function checkDatabase() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alacarte_dev',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🔍 Checking database structure...');

    // Check if restaurant_locations table exists
    const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE '%location%'
            ORDER BY table_name
        `;
    const tables = await pool.query(tablesQuery);
    console.log(
      '📊 Location-related tables:',
      tables.rows.map((t) => t.table_name)
    );

    // If restaurant_locations doesn't exist, check alternatives
    if (!tables.rows.find((t) => t.table_name === 'restaurant_locations')) {
      console.log('❌ restaurant_locations table not found, checking alternatives...');

      const allTablesQuery = `
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            `;
      const allTables = await pool.query(allTablesQuery);
      console.log(
        '📊 All tables:',
        allTables.rows.map((t) => t.table_name)
      );
    } else {
      console.log('✅ restaurant_locations table exists');

      // Check table structure
      const structureQuery = `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'restaurant_locations'
                ORDER BY ordinal_position
            `;
      const structure = await pool.query(structureQuery);
      console.log('📊 restaurant_locations table structure:');
      structure.rows.forEach((col) => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      // Check data in restaurant_locations
      const dataQuery = 'SELECT COUNT(*) as total FROM restaurant_locations';
      const dataCount = await pool.query(dataQuery);
      console.log(`📊 Total locations in database: ${dataCount.rows[0].total}`);

      if (dataCount.rows[0].total > 0) {
        const sampleQuery = 'SELECT * FROM restaurant_locations LIMIT 5';
        const sampleData = await pool.query(sampleQuery);
        console.log('📊 Sample location data:');
        sampleData.rows.forEach((row, index) => {
          console.log(
            `   ${index + 1}. ${row.name} (ID: ${row.id}, Restaurant: ${row.restaurant_id})`
          );
        });
      }
    }
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkDatabase();
