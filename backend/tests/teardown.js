// Global teardown for Jest tests
// This runs after all test suites have completed

module.exports = async () => {
  try {
    // Close the main application database pool
    const { closePool } = require('../src/config/db');
    await closePool();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.warn('Error closing database pool:', error);
  }
};
