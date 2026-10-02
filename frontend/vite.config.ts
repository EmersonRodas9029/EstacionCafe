import { rmSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      // public/mockServiceWorker.js es solo para dev:mock y pruebas: no se publica
      {
        name: 'drop-msw-worker',
        apply: 'build',
        closeBundle: () => rmSync('dist/mockServiceWorker.js', { force: true }),
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'EstaciónCafé',
          short_name: 'EstaciónCafé',
          description: 'Mesas, órdenes, cobro y administración del restaurante',
          lang: 'es',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#3d1c42',
          theme_color: '#3d1c42',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // El worker de MSW es solo para desarrollo
          // Fuentes: el español cabe en el subconjunto latin; los demás se piden solo si hacen falta
          globIgnores: [
            'mockServiceWorker.js',
            '**/*-{latin-ext,vietnamese,cyrillic,cyrillic-ext,greek}-*.woff2',
          ],
          navigateFallback: '/index.html',
          // La API siempre va a la red: datos de caja e inventario no se sirven viejos
          navigateFallbackDenylist: [/^\/api/],
        },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Proxy evita problemas de CORS en desarrollo (hueco #12)
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET ?? 'http://localhost:3484',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      // e2e/ es de Playwright
      exclude: [...configDefaults.exclude, 'e2e/**'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        // Código generado (orval), mocks y arranque no son lógica propia
        exclude: [
          'src/api/generated/**',
          'src/mocks/**',
          'src/test/**',
          'src/main.tsx',
          '**/*.test.*',
        ],
        reporter: ['text-summary', 'html'],
      },
      css: false,
      // Flujos completos con rutas lazy: holgura cuando corren en paralelo
      testTimeout: 20_000,
      // fetch de Node necesita URL absoluta
      env: { VITE_API_URL: 'http://localhost:3484/api' },
    },
  }
})
