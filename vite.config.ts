import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // CodeMirror 核心
          'codemirror-core': [
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/language',
            '@codemirror/commands'
          ],
          // CodeMirror 语言支持
          'codemirror-lang': [
            '@codemirror/lang-sql',
            '@codemirror/autocomplete',
            '@codemirror/lint',
            '@codemirror/search'
          ],
          // CodeMirror 主题
          'codemirror-theme': [
            '@codemirror/theme-one-dark'
          ],
          // 数据库
          'sql.js': ['sql.js'],
          // 图表
          'recharts': ['recharts'],
          // React 生态
          'react-vendor': ['react', 'react-dom'],
          'zustand': ['zustand'],
          // Lucide 图标
          'lucide': ['lucide-react']
        }
      }
    }
  }
})