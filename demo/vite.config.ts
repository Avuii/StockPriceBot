import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/demo/',
  plugins: [react()],
  server: {
    port: 5190,
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        path.resolve(rootDir, '../frontend/dashboard')
      ]
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts']
        }
      }
    }
  }
});
