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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('react')) return 'react-vendor'
            if (id.includes('sentry')) return 'monitoring'
            if (id.includes('recharts')) return 'charts'
            if (id.includes('lucide-react')) return 'icons'
            return 'vendor'
          }
        }
      }
    },
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
