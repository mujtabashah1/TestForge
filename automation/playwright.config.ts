import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

export default defineConfig({
  testDir: './tests',
  globalTeardown: './global-teardown.ts',
  fullyParallel: true,
  forbidOnly: Boolean(env.CI),
  retries: env.CI ? 1 : 0,
  workers: env.CI ? 2 : 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],
  use: {
    baseURL: env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'api', testMatch: /tests\/api\/.*\.spec\.ts/, use: {} },
    { name: 'integration', testMatch: /tests\/integration\/.*\.spec\.ts/, use: {} },
    {
      name: 'chromium',
      testMatch: /tests\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-chromium',
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: /tests\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    { name: 'webkit', testMatch: /tests\/ui\/.*\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
    {
      name: 'mobile-chromium',
      testMatch: /tests\/ui\/responsive\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  outputDir: 'test-results',
});
