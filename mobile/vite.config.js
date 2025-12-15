import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../Frontend/Frontend-Project/src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow external connections for mobile device testing
    port: 5174, // Different port from desktop app
  },
})
