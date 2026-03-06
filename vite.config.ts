import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'codemirror': [
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/lang-sql',
            '@codemirror/theme-one-dark',
            '@codemirror/commands'
          ],
          'sql.js': ['sql.js']
        }
      }
    }
  }
})