
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows the API_KEY you set in terminal to be used in geminiService.ts
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
});
