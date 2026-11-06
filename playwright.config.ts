import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.TARGET ?? 'dev'}` });

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    // 1. Настройка авторизации (выполняется один раз перед UI-тестами)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        baseURL: process.env.UI_BASE_URL ?? 'https://omni.skroy.ru',
      },
    },
    
    // 2. API-тесты (Проверка контрактов на бэкенде)
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        ...devices['Desktop Chrome'],
        // Если API на другом поддомене, берем из .env.dev
        baseURL: process.env.API_BASE_URL ?? 'https://api.users.skroy.ru',
        extraHTTPHeaders: {
          // Передаем Project-Id, который нашли в DevTools. 
          // В .env.dev задай PROJECT_ID=092a3e5a...
          'Project-Id': process.env.PROJECT_ID ?? '092a3e5a-c341-472b-abc3-245d4445d094',
        },
      },
    },
    
    // 3. UI-тесты (E2E сценарии в браузере)
    {
      name: 'ui',
      testDir: './tests/ui',
      // testMatch убран, чтобы запускались ВСЕ тесты в папке tests/ui (happy-path, validation, history и т.д.)
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.UI_BASE_URL ?? 'https://omni.skroy.ru',
        viewport: { width: 1440, height: 900 },
        // Используем сохраненную сессию после auth.setup.ts
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});