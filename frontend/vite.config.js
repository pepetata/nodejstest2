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
  server: {
    port: 3000,
    proxy: {
      '/api': {
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
    include: ['tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    setupFiles: './tests/setup.js',
  },
});
