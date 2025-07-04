/* eslint-disable no-console */
/* eslint-disable no-process-exit */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// Function to execute SQL file
const executeSqlFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await db.query(sql);
    console.log(`Executed SQL file: ${filePath}`);
  } catch (error) {
    console.error(`Error executing SQL file ${filePath}:`, error);
    throw error;
  }
};

// Function to run only migrations (no seeds)
const runMigrations = async () => {
  try {
    console.log('Running database migrations...');

    // Execute migration files in order
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      await executeSqlFile(path.join(migrationsDir, file));
    }

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Database migrations failed:', error);
    throw error;
  }
};

// Function to run only seeds (no migrations)
const runSeeds = async () => {
  try {
    console.log('Running database seeds...');

    // Execute seed files in order
    const seedsDir = path.join(__dirname, 'seeds');
    const seedFiles = fs
      .readdirSync(seedsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of seedFiles) {
      await executeSqlFile(path.join(seedsDir, file));
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
};

// Main seed function (runs both migrations and seeds - backward compatibility)
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    await runMigrations();
    await runSeeds();

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.closePool();
  }
};

// Function to run only seeds with connection management
const seedOnly = async () => {
  try {
    await runSeeds();
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  } finally {
    await db.closePool();
  }
};

// Function to run only migrations with connection management
const migrationsOnly = async () => {
  try {
    await runMigrations();
  } catch (error) {
    console.error('Database migrations failed:', error);
    throw error;
  } finally {
    await db.closePool();
  }
};

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  runMigrations,
  runSeeds,
  seedOnly,
  migrationsOnly,
};
