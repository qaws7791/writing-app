import path from "node:path"

import { defineConfig, devices } from "@playwright/test"
import {
  releaseE2eProjects,
  releaseE2eTestFiles,
  type ReleaseE2eProject,
} from "#scripts/playwright-release-plan"

const e2eRunRoot = readRequiredEnvironment("E2E_RUN_ROOT")
const isCi = Boolean(process.env["CI"])
const releaseDeviceByProject = {
  "release-chromium": "Desktop Chrome",
  "release-webkit": "iPhone 16 Pro",
} as const satisfies Record<ReleaseE2eProject, keyof typeof devices>

export default defineConfig({
  failOnFlakyTests: isCi,
  testDir: "./e2e",
  testIgnore: "**/*.visual.spec.ts",
  fullyParallel: false,
  forbidOnly: isCi,
  globalTimeout: 600_000,
  outputDir: "output/playwright/test-results",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "output/playwright/report" }],
  ],
  retries: 0,
  projects: [
    {
      name: "pr-chromium",
      testMatch: "pr-smoke.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    ...releaseE2eProjects.map((name) => ({
      name,
      testMatch: releaseE2eTestFiles,
      use: { ...devices[releaseDeviceByProject[name]] },
    })),
  ],
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
    baseURL: "http://localhost:3100",
    launchOptions: {
      downloadsPath: path.join(e2eRunRoot, "downloads"),
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
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
