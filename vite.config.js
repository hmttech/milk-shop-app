import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      // Optimize chunk splitting for better loading
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          pdf: ['jspdf'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  // Copy public files to dist
  publicDir: 'public'
})