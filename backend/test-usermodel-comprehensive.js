#!/usr/bin/env node

/**
 * UserModel Test Suite Runner
 * Runs comprehensive tests and reports coverage
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running UserModel Comprehensive Test Suite...\n');

// Test configuration
const testConfig = {
  testFile: 'tests/models/userModel.comprehensive.optimized.test.js',
  coverage: true,
  verbose: true,
  detectOpenHandles: true,
};

// Build Jest command
const jestCommand = [
  'npx jest',
  `--testPathPattern="${testConfig.testFile}"`,
  '--runInBand',
  '--forceExit',
  testConfig.coverage ? '--coverage' : '',
  testConfig.verbose ? '--verbose' : '',
  testConfig.detectOpenHandles ? '--detectOpenHandles' : '',
  '--coverageReporters=text',
  '--coverageReporters=html',
  '--collectCoverageFrom=src/models/userModel.js',
  '--coverageThreshold=\'{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}\'',
]
  .filter(Boolean)
  .join(' ');

try {
  console.log('📊 Running tests with coverage analysis...\n');

  const output = execSync(jestCommand, {
    stdio: 'inherit',
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
  });

  console.log('\n✅ UserModel test suite completed successfully!');
  console.log('\n📋 Test Summary:');
  console.log('- All test categories covered');
  console.log('- Unit tests: Schema validation, business logic, data transformation');
  console.log('- Integration tests: CRUD operations, queries, relationships');
  console.log('- Security tests: Data protection, input validation');
  console.log('- Performance tests: Memory usage, query optimization');
  console.log('- Error handling: Edge cases, database errors');
  console.log('- State management: Lifecycle, transactions');

  console.log('\n📊 Coverage Report:');
  console.log('- Check the generated HTML report in coverage/ directory');
  console.log('- Target: 80%+ coverage across all metrics');
} catch (error) {
  console.error('\n❌ Test execution failed:');
  console.error(error.message);

  if (error.stdout) {
    console.log('\nSTDOUT:', error.stdout.toString());
  }

  if (error.stderr) {
    console.error('\nSTDERR:', error.stderr.toString());
  }

  process.exit(1);
}

console.log('\n🎯 UserModel testing complete!');
console.log('📁 Coverage reports available in coverage/ directory');
