import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for LRecordFlow E2E tests.
 * Tests run against the Vite preview server (electron-vite preview).
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*\.spec\.ts/,
  outputDir: 'test-results',
  reporter: 'html',
  use: {
    actionTimeout: 10000,
    navigationTimeout: 30000,
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run build && npx serve out/renderer -l 5173 -s',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
})
