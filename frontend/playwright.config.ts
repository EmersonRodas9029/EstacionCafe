import { defineConfig, devices } from '@playwright/test'

/**
 * E2E contra el stack real: API (Express + Postgres) y Vite.
 * Cada corrida recrea la BD `estacioncafe_e2e` con los datos demo del seeder.
 * Requiere Postgres arriba (`npm --prefix ../api run db:up`).
 */
const API_PORT = 3485
const WEB_PORT = 5174
export const API_URL = `http://localhost:${API_PORT}/api`

export default defineConfig({
  testDir: './e2e',
  // Comparten una sola BD: en serie para que los flujos no se pisen
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: 'es-SV',
    timezoneId: 'America/El_Salvador',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] }, grepInvert: /@movil/ },
    { name: 'movil', use: { ...devices['Pixel 7'] }, grep: /@movil/ },
  ],
  webServer: [
    {
      command: 'npm run e2e:db && npm run start:e2e',
      cwd: '../api',
      url: `http://localhost:${API_PORT}/health`,
      env: {
        PORT: String(API_PORT),
        DB_DATABASE: 'estacioncafe_e2e',
        DB_LOGGING: 'false',
        CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `pnpm exec vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { VITE_API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
