/* eslint-disable no-console */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configurations for different environments
const environments = {
  production: 'alacarte_prod',
  development: 'alacarte_dev',
  test: 'alacarte_test',
};

// Default PostgreSQL connection (to create databases)
const defaultConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default postgres database to create new ones
};

// Function to read SQL file
function readSQLFile(filename) {
  const sqlPath = path.join(__dirname, '..', 'src', 'db', 'migrations', filename);
  return fs.readFileSync(sqlPath, 'utf8');
}

// Function to create a database
async function createDatabase(dbName) {
  const client = new Client(defaultConfig);

  try {
    await client.connect();

    // Check if database exists
    const checkDb = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

    if (checkDb.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`ℹ️  Database '${dbName}' already exists`);
    }
  } catch (error) {
    console.error(`❌ Error creating database '${dbName}':`, error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Function to create tables in a specific database
async function createTables(dbName) {
  const config = Object.assign({}, defaultConfig, { database: dbName });
  const client = new Client(config);

  try {
    await client.connect();

    console.log(`Creating tables in database '${dbName}'...`);

    // Create tables in order (respecting foreign key dependencies)
    await client.query(readSQLFile('004_create_restaurants_table.sql'));
    console.log(`  ✅ 'restaurants' table created`);

    await client.query(readSQLFile('005_create_restaurant_locations_table.sql'));
    console.log(`  ✅ 'restaurant_locations' table created`);

    await client.query(readSQLFile('006_create_billing_addresses_table.sql'));
    console.log(`  ✅ 'billing_addresses' table created`);

    await client.query(readSQLFile('007_create_payment_info_table.sql'));
    console.log(`  ✅ 'payment_info' table created`);

    // Create timestamp triggers
    await client.query(readSQLFile('008_create_timestamp_triggers.sql'));
    console.log(`  ✅ Triggers created`);

    console.log(`✅ All tables created successfully in '${dbName}'`);
  } catch (error) {
    console.error(`❌ Error creating tables in '${dbName}':`, error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Main function to setup all databases and tables
async function setupDatabases() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Create databases
    for (const [env, dbName] of Object.entries(environments)) {
      console.log(`Setting up ${env} database: ${dbName}`);
      await createDatabase(dbName);
      await createTables(dbName);
      console.log(`✅ ${env} database setup complete\n`);
    }

    console.log('🎉 All databases and tables created successfully!');
    console.log('\nDatabases created:');
    Object.entries(environments).forEach(([env, dbName]) => {
      console.log(`  - ${env}: ${dbName}`);
    });

    console.log('\nTables created in each database:');
    console.log('  - restaurants (main restaurant info)');
    console.log('  - restaurant_locations (location details)');
    console.log('  - billing_addresses (billing information)');
    console.log('  - payment_info (payment details)');
    console.log('\nIndexes and triggers have been created for optimal performance.');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabases();
}

module.exports = {
  setupDatabases,
  createDatabase,
  createTables,
  environments,
};
