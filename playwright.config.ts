import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4178', headless: true },
  webServer: {
    command: 'pnpm preview --port 4178 --strictPort',
    url: 'http://127.0.0.1:4178',
    reuseExistingServer: false,
  },
});
