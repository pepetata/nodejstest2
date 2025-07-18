// Test the actual database schema to see what columns exist
const db = require('./src/config/db');

async function checkUserTableSchema() {
  console.log('Checking user table schema...\n');

  try {
    // Check the actual columns in the users table
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;

    const result = await db.query(schemaQuery);

    console.log('Users table columns:');
    result.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name} (${row.data_type}${row.is_nullable === 'YES' ? ', nullable' : ''})`
      );
    });

    // Check what tables exist for location assignments
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%location%'
      ORDER BY table_name;
    `;

    const tablesResult = await db.query(tablesQuery);

    console.log('\nLocation-related tables:');
    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // Check what tables exist for user roles
    const userTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%user%'
      ORDER BY table_name;
    `;

    const userTablesResult = await db.query(userTablesQuery);

    console.log('\nUser-related tables:');
    userTablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });
  } catch (error) {
    console.error('Error checking schema:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUserTableSchema();
