import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base:'/',
    server: {
      host: true,
      port: 5173,
      allowedHosts: ['lcoin.eu', 'www.lcoin.eu', 'localhost', '127.0.0.1']
    }
  }
})


