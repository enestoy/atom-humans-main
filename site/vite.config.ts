import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { 'atom-humans': fileURLToPath(new URL('../src/index.ts', import.meta.url)) },
    dedupe: ['react', 'react-dom'],
  },
});
