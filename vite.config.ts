import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use a fallback for process.cwd() in case of restricted environments, though rare
  const cwd = (process as any).cwd ? (process as any).cwd() : '.';
  const env = loadEnv(mode, cwd, '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the Gemini service
      // Default to empty string if undefined to prevent build errors
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  }
})