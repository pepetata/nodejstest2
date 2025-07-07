// Test setup file for Jest
// This file runs before each test suite

// Load environment variables from .env file FIRST
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'SILENT'; // Set log level to completely silence logs
process.env.ENABLE_FILE_LOGGING = 'false'; // Disable file logging during tests
process.env.DB_NAME = 'alacarte_test'; // Set test database name

// Suppress console output during tests to keep them clean
const originalConsole = global.console;

global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Store original console for potential restoration if needed in specific tests
global.originalConsole = originalConsole;
