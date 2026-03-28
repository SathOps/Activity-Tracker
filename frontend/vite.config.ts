import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const corpusToken = env.CORPUS_TOKEN || '';
  const swechaApiBaseUrl =
    env.SWECHA_API_BASE_URL ||
    env.VITE_SWECHA_API_BASE_URL ||
    'https://api.corpus.swecha.org';

  return {
    plugins: [react()],
    test: {
      coverage: {
        all: true,
        provider: 'v8',
        include: [
          'src/modules/**/*.ts',
          'src/services/**/*.ts',
          'src/store/**/*.ts',
          'src/utils/**/*.ts',
        ],
        exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/index.ts'],
        thresholds: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: swechaApiBaseUrl,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const requestAuthHeader = proxyReq.getHeader('authorization');
              const requestPath = req.url || '';
              const isAuthRoute = requestPath.startsWith('/api/v1/auth/');

              if (!requestAuthHeader && corpusToken && !isAuthRoute) {
                proxyReq.setHeader('Authorization', `Bearer ${corpusToken}`);
              }
            });
          },
        },
      },
    },
  };
});
