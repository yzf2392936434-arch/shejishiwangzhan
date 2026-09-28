import path from 'path';
import { defineConfig } from '@lark-apaas/coding-preset-vite-react';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
});
