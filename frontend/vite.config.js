import { defineConfig } from 'vite';
import process from 'node:process';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

const backendTarget = process.env.BACKEND_ORIGIN ?? 'http://localhost:3000';
const backendPaths = [
  '/admin',
  '/auth',
  '/categories',
  '/docs',
  '/health',
  '/transactions',
  '/upload',
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: Object.fromEntries(backendPaths.map((path) => [
      path,
      { target: backendTarget, changeOrigin: true },
    ])),
  },
});
