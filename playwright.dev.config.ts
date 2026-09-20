import { defineConfig, devices } from '@playwright/test'

import { DEV_API_URL, DEV_WEB_URL } from './e2e/config'

/**
 * Прогон одного сценария — дев-связки из README (`npm start` плюс `npm run dev` в `ui/`).
 *
 * Отдельный конфиг, а не проект внутри основного, по одной причине: здесь принципиально
 * **не** передаётся `VITE_API_URL`. Основной конфиг подставляет его сам
 * (`playwright.config.ts`), и адрес API берётся из `ui/.env.development` — то есть
 * проверяется ровно тот механизм, на который опирается README.
 *
 * Порты те же, что в инструкции (3000 и 5173), поэтому перед прогоном свои дев-серверы
 * надо остановить — иначе Playwright не сможет их поднять.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'dev-smoke.spec.ts',
  timeout: 30_000,
  expect: { timeout: 7_000 },

  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: DEV_WEB_URL,
    trace: 'off',
    locale: 'ru-RU',
    timezoneId: 'UTC',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: [
    {
      command: 'node server/index.js',
      url: `${DEV_API_URL}/event-types`,
      env: { PORT: '3000' },
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      // Именно `npm run dev`, командой из README, и без `VITE_API_URL` в окружении.
      command: 'npm run dev',
      cwd: 'ui',
      url: DEV_WEB_URL,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
