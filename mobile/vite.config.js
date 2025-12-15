import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Add Tailwind CSS plugin
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Add this for shadcn
      '@shared': path.resolve(__dirname, '../Frontend/Frontend-Project/src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
})