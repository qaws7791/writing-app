import { fileURLToPath } from "node:url"

import { defineConfig, devices } from "@playwright/test"

const webDir = fileURLToPath(new URL(".", import.meta.url))
const apiDir = fileURLToPath(new URL("../api", import.meta.url))

export default defineConfig({
  fullyParallel: false,
  reporter: "list",
  retries: process.env.CI ? 2 : 0,
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "bun run test:serve",
      cwd: apiDir,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://127.0.0.1:3010/health",
    },
    {
      command: "bun --env-file=.env.test --bun next dev --port 3000",
      cwd: webDir,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://127.0.0.1:3000",
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
})
