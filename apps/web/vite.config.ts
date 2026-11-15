import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SERVER = 'http://localhost:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: {
    port: 5173,
    // Same-origin API and sockets: no CORS.
    proxy: {
      '/api': SERVER,
      '/socket.io': { target: SERVER, ws: true },
    },
  },
});
