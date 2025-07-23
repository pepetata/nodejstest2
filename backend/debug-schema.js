const db = require('./src/config/db');

async function checkSchema() {
  try {
    console.log('Checking languages table schema...');
    const result = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'languages'
      ORDER BY ordinal_position
    `);

    console.log('Languages table columns:');
    result.rows.forEach((row) => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    console.log('\nChecking sample data...');
    const data = await db.query('SELECT * FROM languages LIMIT 3');
    console.log('Sample languages:');
    data.rows.forEach((row) => {
      console.log(
        `- ID: ${row.id}, Name: ${row.name || 'N/A'}, Native: ${row.native_name || row.native || 'N/A'}`
      );
    });
  } catch (error) {
    console.error('Error:', error.message);
  }

  process.exit(0);
}

checkSchema();
