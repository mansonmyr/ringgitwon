import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { twelveDataMiddleware } from './server/twelveData';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'TWELVE_DATA_');
  const middleware = twelveDataMiddleware(env.TWELVE_DATA_API_KEY?.trim() ?? '');
  return {
    plugins: [react(), {
      name: 'ringgitwon-intraday-api',
      configureServer(server) { server.middlewares.use(middleware); },
      configurePreviewServer(server) { server.middlewares.use(middleware); },
    }],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },
    preview: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },
  };
});
