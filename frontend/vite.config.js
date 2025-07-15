import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Add base URL to handle different path scenarios
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Use modern Sass API to avoid deprecation warnings
        api: 'modern-compiler',
        // You can also add global variables here if needed
        // additionalData: `@use "./src/styles/variables.scss" as vars;`
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    fs: {
      // Allow serving files from one level up to the project root and handle mapped drives
      allow: ['..', '/'],
      strict: false,
    },
    hmr: {
      overlay: true, // Show error overlay
    },
  },
  optimizeDeps: {
    force: true, // Force dependency optimization
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setupTests.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/setupTests.js',
        '**/*.{test,spec}.{js,jsx}',
        '**/tests/**',
        'dist/',
        'coverage/',
        'vite.config.js',
        'tailwind.config.js',
        'eslint.config.js',
      ],
      include: ['src/**/*.{js,jsx}'],
      all: false, // Only show coverage for tested files
    },
  },
});
