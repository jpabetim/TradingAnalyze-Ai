import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5000,
    host: '0.0.0.0',
    proxy: {
      '/api/binance': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/binance/, '')
      },
      '/api/bingx': {
        target: 'https://open-api.bingx.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bingx/, '')
      }
    }
  }
});
