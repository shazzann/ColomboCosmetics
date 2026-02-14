import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  // server: {
  //   host: true,
  //   port: 5173,
  //   allowedHosts: ['bff7-2402-d000-810c-455e-985f-ff33-a558-b30a.ngrok-free.app', 'localhost', '127.0.0.1', '0.0.0.0','all'],
  // }
})
