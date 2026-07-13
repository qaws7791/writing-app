import path from "node:path"

import { defineConfig } from "@playwright/test"

const databaseUrl = path.resolve("data/e2e/writing-app.sqlite")
const authSecret = "e2e-auth-secret-must-have-32-characters"
const isCi = Boolean(process.env["CI"])

export default defineConfig({
  failOnFlakyTests: isCi,
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isCi,
  outputDir: "output/playwright/test-results",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "output/playwright/report" }],
  ],
  retries: isCi ? 1 : 0,
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
      scale: "css",
    },
  },
  use: {
    baseURL: "http://127.0.0.1:3100",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    viewport: { height: 720, width: 1280 },
  },
  workers: 1,
  webServer: [
    {
      command: "bun e2e/fixture-server.ts",
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:4199",
    },
    {
      command: "bun apps/api/src/main.ts",
      env: {
        API_PORT: "4100",
        BETTER_AUTH_SECRET: authSecret,
        BETTER_AUTH_URL: "http://127.0.0.1:4100",
        DATABASE_URL: databaseUrl,
        ENABLE_TEST_AUTH: "true",
        NODE_ENV: "test",
        WEB_ORIGIN: "http://127.0.0.1:3100",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:4100/health",
    },
    {
      command:
        "bun node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100",
      cwd: path.resolve("apps/web"),
      env: {
        ENABLE_TEST_AUTH: "true",
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:4100",
        WEB_API_BASE_URL: "http://127.0.0.1:4100",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:3100/login",
    },
    {
      command: "bun apps/admin-api/src/main.ts",
      env: {
        ADMIN_API_PORT: "4101",
        ADMIN_BETTER_AUTH_SECRET: authSecret,
        ADMIN_BETTER_AUTH_URL: "http://127.0.0.1:4101",
        ADMIN_ORIGIN: "http://127.0.0.1:3101",
        DATABASE_URL: databaseUrl,
        NODE_ENV: "test",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:4101/health",
    },
    {
      command:
        "bun node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3101",
      cwd: path.resolve("apps/admin"),
      env: {
        ADMIN_API_BASE_URL: "http://127.0.0.1:4101",
        NEXT_PUBLIC_ADMIN_API_BASE_URL: "http://127.0.0.1:4101",
        NEXT_PUBLIC_LEARNER_WEB_ORIGIN: "http://127.0.0.1:3100",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:3101/login",
    },
  ],
})
