import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Shared Vite config for both frontend apps — identical plugins/proxy setup,
// only the dev-server port differs per app.
export function createViteConfig({ port, apiTarget = 'http://localhost:5200' }) {
  return defineConfig({
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        }
      }
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        }
      }
    }
  })
}
