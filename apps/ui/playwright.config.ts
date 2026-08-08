import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4322",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bun run build && bun run preview --host 127.0.0.1 --port 4322",
    url: "http://127.0.0.1:4322/docs/getting-started",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
