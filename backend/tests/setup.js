// Test setup file for Jest
// This file runs before each test suite

// Load environment variables from .env file FIRST
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
