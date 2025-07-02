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

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Execute migration files in order
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      await executeSqlFile(path.join(migrationsDir, file));
    }

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
    process.exit(1);
  } finally {
    // Close database connection
    await db.closePool();
  }
};

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
