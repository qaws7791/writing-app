import path from "node:path"

import { defineConfig } from "@playwright/test"

const e2eRunRoot = readRequiredEnvironment("E2E_RUN_ROOT")
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
    launchOptions: {
      downloadsPath: path.join(e2eRunRoot, "downloads"),
    },
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    viewport: { height: 720, width: 1280 },
  },
  workers: 1,
})

function readRequiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()

  if (value === undefined || value.length === 0) {
    throw new Error(
      `${name}이 없습니다. 격리된 실행을 위해 bun run test:e2e를 사용해 주세요.`
    )
  }

  return path.resolve(value)
}
