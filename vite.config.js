import { defineConfig } from 'vite';

// The office talks to the local Paperclip instance through this proxy, so the
// browser never needs cross-origin access. Start Paperclip with
// paperclip/start.sh; override the target with PAPERCLIP_API_URL if it moves.
const paperclip = process.env.PAPERCLIP_API_URL || 'http://localhost:3100';

export default defineConfig({
  build: { target: 'es2022' },
  server: {
    watch: { ignored: ['**/paperclip/**'] },
    proxy: {
      '/paperclip': {
        target: paperclip,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/paperclip/, '/api'),
      },
    },
  },
});
