import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { twelveDataMiddleware } from './server/twelveData';
import { twelveDataHistoryMiddleware } from './server/twelveDataHistory';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'TWELVE_DATA_');
  const middleware = twelveDataMiddleware(env.TWELVE_DATA_API_KEY?.trim() ?? '');
  const historyMiddleware = twelveDataHistoryMiddleware(env.TWELVE_DATA_API_KEY?.trim() ?? '');
  return {
    plugins: [react(), {
      name: 'ringgitwon-intraday-api',
      configureServer(server) { server.middlewares.use(middleware); server.middlewares.use(historyMiddleware); },
      configurePreviewServer(server) { server.middlewares.use(middleware); server.middlewares.use(historyMiddleware); },
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
