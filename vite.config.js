import { defineConfig } from 'vite';

// 舊網站（API 閘道）的 Vercel 線上域名
// 本地開發時代理到舊網站的 local server (http://localhost:3001)
// 線上部署時由 vercel.json 的 rewrites 負責代理
const OLD_SITE_API = process.env.VITE_API_GATEWAY || 'http://localhost:3001';

export default defineConfig({
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: OLD_SITE_API,
        changeOrigin: true,
        // 本地開發：新網站呼叫 /api/* 全部代理到舊網站的 local server
        // 確保兩個網站本地開發時共用同一組 API 與快取
      }
    }
  }
});
