import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4175';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 15000 },
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm.cmd run dev -- --host 127.0.0.1 --port 4175',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      VITE_SUPABASE_URL: 'https://backend.test',
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key'
    }
  }
});
