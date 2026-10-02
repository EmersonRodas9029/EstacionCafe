import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
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
