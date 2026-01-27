
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Suddividiamo il codice in pezzi (chunks) più piccoli
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    },
    // Alziamo leggermente il limite del warning per i chunk più densi se necessario
    chunkSizeWarningLimit: 800
  }
})
