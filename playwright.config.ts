import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:8082', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm --workspace @apms/mobile run web -- --port 8082',
    url: 'http://127.0.0.1:8082',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ...process.env, EXPO_NO_DOTENV: '1', EXPO_PUBLIC_DEMO_MODE: 'true', CI: '1' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1194, height: 836 } } }],
});
