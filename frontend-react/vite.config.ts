import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite is the tool that runs and builds the React app. (Imported from 'vitest/config' so the test settings below are allowed.)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Lets us write '@/lib/api' instead of '../../lib/api' ('@' means the src folder).
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    // Any request the React app makes to /api/... is passed on to the Flask backend.
    // This means the browser only ever talks to one address, so login cookies just work.
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true, // rewrite the request's host name so it matches the Flask server
      },
    },
  },
  // Settings for Vitest, the tool that runs our tests (pnpm test).
  test: {
    environment: 'jsdom', // a pretend browser, so React components can be drawn during tests
    setupFiles: './src/test/setup.ts', // runs before every test file
    globals: true, // lets tests use describe / it / expect without importing them
  },
})
