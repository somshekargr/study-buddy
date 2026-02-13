import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/study-buddy/',
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: [
      "trancelike-johna-uncalmly.ngrok-free.dev",
    ],
  },
  optimizeDeps: {
    include: ['react-force-graph-2d'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
