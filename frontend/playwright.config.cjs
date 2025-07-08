// playwright.config.cjs for backend API e2e tests
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './testse2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5000', // Updated to match backend port
    trace: 'on-first-retry',
  },
  // webServer: {
  //   command: 'set NODE_ENV=test&& node server.js', // Correct Windows syntax and path
  //   url: 'http://localhost:5000',
  //   timeout: 10000,
  //   reuseExistingServer: true, // Always reuse the running server
  //   cwd: '../backend', // Ensure working directory is backend
  // },
  projects: [
    {
      name: 'API',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
