// Test setup file for Jest
// This file runs before each test suite

// Load environment variables from .env file FIRST
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'SILENT'; // Set log level to completely silence logs
process.env.ENABLE_FILE_LOGGING = 'false'; // Disable file logging during tests

// Suppress console output during tests to keep them clean
const originalConsole = global.console;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock stdout and stderr to catch all output including custom logger
process.stdout.write = jest.fn();
process.stderr.write = jest.fn();

// Store originals for potential restoration if needed in specific tests
global.originalConsole = originalConsole;
global.originalStdout = originalStdout;
global.originalStderr = originalStderr;
