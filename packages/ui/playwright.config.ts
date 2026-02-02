import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  workers: 4,
  fullyParallel: true,
  webServer: {
    command: 'bun run build && bun run preview --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        baseURL: 'http://localhost:4173',
        launchOptions: {
          executablePath:
            process.env.CHROMIUM_PATH || '/run/current-system/sw/bin/chromium',
          headless: true,
        },
      },
    },
  ],
});
