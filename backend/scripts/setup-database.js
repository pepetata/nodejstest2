/**
 * Modern Database Setup Script
 *
 * This script replaces the old create_databases_and_tables.js and provides
 * a unified approach to database setup that leverages the modern migration
 * and seeding system in src/db/
 *
 * Features:
 * - Creates databases for all environments
 * - Runs migrations and seeds using the centralized system
 * - Proper error handling and logging
 * - Environment-aware configuration
 */

/* eslint-disable no-console */
/* eslint-disable no-process-exit */
const { Client } = require('pg');
require('dotenv').config();

// Database environments configuration
const environments = {
  production: 'alacarte_prod',
  development: 'alacarte_dev',
  test: 'alacarte_test',
};

// Default PostgreSQL connection (for creating databases)
const defaultConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default postgres database
};

/**
 * Create a database if it doesn't exist
 */
async function createDatabase(dbName) {
  const client = new Client(defaultConfig);

  try {
    await client.connect();

    // Check if database exists
    const checkDb = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

    if (checkDb.rows.length === 0) {
      // Create database with proper settings
      await client.query(`CREATE DATABASE ${dbName}
        WITH
        ENCODING = 'UTF8'
        LC_COLLATE = 'en_US.UTF-8'
        LC_CTYPE = 'en_US.UTF-8'
        TEMPLATE = template0`);
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

/**
 * Run migrations and seeds for a specific database
 */
async function setupDatabase(dbName, migrationsOnly = false, seedOnly = false) {
  if (seedOnly) {
    console.log(`🌱 Seeding database: ${dbName}`);
  } else if (migrationsOnly) {
    console.log(`🔧 Setting up database structure: ${dbName}`);
  } else {
    console.log(`🔧 Setting up database: ${dbName}`);
  }

  // Temporarily set the database name in environment
  const originalDbName = process.env.DB_NAME;
  process.env.DB_NAME = dbName;

  try {
    // Import the database functions
    const {
      migrationsOnly: runMigrationsOnly,
      seedOnly: runSeedOnly,
      seedDatabase,
    } = require('../src/db/seedDatabase');

    if (seedOnly) {
      await runSeedOnly();
      console.log(`✅ Database '${dbName}' seeded successfully\n`);
    } else if (migrationsOnly) {
      await runMigrationsOnly();
      console.log(`✅ Database '${dbName}' structure setup completed\n`);
    } else {
      await seedDatabase();
      console.log(`✅ Database '${dbName}' setup completed\n`);
    }
  } catch (error) {
    const action = seedOnly
      ? 'seeding'
      : migrationsOnly
        ? 'setting up structure for'
        : 'setting up';
    console.error(`❌ Error ${action} database '${dbName}':`, error.message);
    throw error;
  } finally {
    // Restore original database name
    if (originalDbName) {
      process.env.DB_NAME = originalDbName;
    } else {
      delete process.env.DB_NAME;
    }
  }
}

/**
 * Main setup function
 */
async function setupAllDatabases(migrationsOnly = false, seedOnly = false) {
  if (seedOnly) {
    console.log('🌱 Starting database seeding for all environments...\n');
  } else if (migrationsOnly) {
    console.log('🔧 Starting database structure setup for all environments...\n');
  } else {
    console.log('🚀 Starting comprehensive database setup...\n');
  }

  try {
    // Create and setup each database
    for (const [env, dbName] of Object.entries(environments)) {
      if (seedOnly) {
        console.log(`🌱 Seeding ${env} environment (${dbName})`);
        // For seed-only, don't create database, just seed it
        await setupDatabase(dbName, false, true);
      } else {
        console.log(`📂 Setting up ${env} environment (${dbName})`);

        // Create database
        await createDatabase(dbName);

        // Run migrations and/or seeds
        await setupDatabase(dbName, migrationsOnly, seedOnly);
      }
    }

    if (seedOnly) {
      console.log('🎉 All databases seeded successfully!\n');
      console.log('📋 Seed Data Summary:');
      console.log('  • Admin and test users');
      console.log('  • Sample menu items (appetizers, mains, desserts, beverages)');
      console.log('  • 3 sample restaurants with different configurations');
      console.log('  • Restaurant locations with operating hours and features');
    } else if (migrationsOnly) {
      console.log('🎉 All database structures setup successfully!\n');
      console.log('📋 Structure Summary:');
      console.log('Databases created and configured:');
      Object.entries(environments).forEach(([env, dbName]) => {
        console.log(`  • ${env}: ${dbName}`);
      });
      console.log('\n📊 Tables created:');
      console.log('  • users, menu_items, orders, order_items');
      console.log('  • restaurants, restaurant_locations');
      console.log('  • billing_addresses, payment_info');
      console.log('  • Proper indexes, constraints, and triggers');
      console.log('\n� Ready for seeding! Use seed commands to add sample data.');
    } else {
      console.log('🎉 All databases setup successfully!\n');
      console.log('📋 Summary:');
      console.log('Databases created and configured:');
      Object.entries(environments).forEach(([env, dbName]) => {
        console.log(`  • ${env}: ${dbName}`);
      });

      console.log('\n�📊 Each database contains:');
      console.log('  • All migration tables (users, menu_items, orders, restaurants, etc.)');
      console.log('  • Restaurant seed data (3 sample restaurants with locations)');
      console.log('  • Proper indexes, constraints, and triggers');
      console.log('  • Ready for development/testing');
    }

    if (!migrationsOnly) {
      console.log('\n🔐 Test login credentials:');
      console.log('  • Email: joao@pizzariabella.com.br | Password: pizza123');
      console.log('  • Email: maria@burgerhouse.com.br | Password: burger456');
      console.log('  • Email: carlos@sabortropical.com.br | Password: tropical789');
    }
  } catch (error) {
    const action = seedOnly ? 'seeding' : migrationsOnly ? 'structure setup' : 'setup';
    console.error(`\n❌ Database ${action} failed:`, error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Ensure PostgreSQL is running');
    console.log('  2. Check database credentials in .env file');
    console.log('  3. Verify database user has CREATE DATABASE privileges');
    if (seedOnly) {
      console.log('  4. Ensure database structure exists (run setup commands first)');
    }
    process.exit(1);
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🗃️  Database Setup Tool

Usage: node scripts/setup-database.js [options]

Options:
  --help, -h           Show this help message
  --env <name>         Setup only specific environment (development, test, production)
  --migrations-only    Create database and run migrations only (no seed data)
  --seed-only          Run seed data only (database must already exist)

Examples:
  node scripts/setup-database.js                              # Setup all environments (full)
  node scripts/setup-database.js --migrations-only            # Setup structure only (all envs)
  node scripts/setup-database.js --env development            # Full setup for dev only
  node scripts/setup-database.js --env development --migrations-only  # Structure only for dev
  node scripts/setup-database.js --env development --seed-only        # Seed dev database only

  npm run db:setup:dev     # Setup dev database structure only
  npm run seed:dev         # Seed dev database only

Setup Commands (create database + run migrations only):
  ✅ Create PostgreSQL databases for specified environments
  ✅ Run all migrations (tables, indexes, constraints, triggers)
  ❌ Skip seed data insertion

Seed Commands (insert data only):
  ✅ Insert seed data (users, menu items, restaurants, locations)
  ❌ Skip database creation and migrations
`);
    process.exit(0);
  }

  // Check for flags
  const migrationsOnly = args.includes('--migrations-only');
  const seedOnly = args.includes('--seed-only');

  // Validate flags
  if (migrationsOnly && seedOnly) {
    console.error('❌ Cannot use both --migrations-only and --seed-only flags together');
    process.exit(1);
  }

  // Handle single environment setup
  const envIndex = args.indexOf('--env');
  if (envIndex !== -1 && args[envIndex + 1]) {
    const targetEnv = args[envIndex + 1];
    if (environments[targetEnv]) {
      const dbName = environments[targetEnv];

      if (seedOnly) {
        console.log(`� Seeding only ${targetEnv} environment...\n`);
        setupDatabase(dbName, false, true)
          .then(() => {
            console.log(`✅ ${targetEnv} database seeded successfully!`);
          })
          .catch((error) => {
            console.error(`❌ Failed to seed ${targetEnv} database:`, error.message);
            process.exit(1);
          });
      } else {
        const action = migrationsOnly ? 'Setting up structure for' : 'Setting up';
        console.log(`🎯 ${action} ${targetEnv} environment...\n`);

        createDatabase(dbName)
          .then(() => setupDatabase(dbName, migrationsOnly, seedOnly))
          .then(() => {
            const completed = migrationsOnly ? 'structure setup' : 'setup';
            console.log(`✅ ${targetEnv} database ${completed} completed!`);
          })
          .catch((error) => {
            const action = migrationsOnly ? 'setup structure for' : 'setup';
            console.error(`❌ Failed to ${action} ${targetEnv} database:`, error.message);
            process.exit(1);
          });
      }
    } else {
      console.error(`❌ Invalid environment: ${targetEnv}`);
      console.log(`Available environments: ${Object.keys(environments).join(', ')}`);
      process.exit(1);
    }
  } else {
    // Setup all databases
    setupAllDatabases(migrationsOnly, seedOnly);
  }
}

module.exports = {
  setupAllDatabases,
  createDatabase,
  setupDatabase,
  environments,
};
