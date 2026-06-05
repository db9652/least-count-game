import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/least-count/',
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['games.chintuladdu.online']
  }
})
