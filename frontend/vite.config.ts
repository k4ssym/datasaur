import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** After each build, copy dist to my-project/frontend/dist so backend serves latest without manual copy. */
function copyToBackendPlugin() {
  return {
    name: 'copy-to-backend',
    closeBundle() {
      const src = path.join(process.cwd(), 'dist')
      const dest = path.join(process.cwd(), '..', 'my-project', 'frontend', 'dist')
      if (!fs.existsSync(src)) return
      fs.mkdirSync(dest, { recursive: true })
      fs.cpSync(src, dest, { recursive: true })
      console.log('[vite] Copied dist → my-project/frontend/dist')
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyToBackendPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/health': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/diagnose': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
})
