import path from "node:path"

import { defineConfig, devices } from "@playwright/test"
import { e2eRuntime, readRequiredE2eEnvironment } from "#e2e/runtime"
import {
  releaseE2eProjects,
  releaseE2eTestFiles,
  type ReleaseE2eProject,
} from "#scripts/playwright-release-plan"

const e2eRunRoot = path.resolve(readRequiredE2eEnvironment("E2E_RUN_ROOT"))
const serverScope = readServerScope()
const isCi = Boolean(process.env["CI"])
const releaseDeviceByProject = {
  "release-chromium": "Desktop Chrome",
  "release-webkit": "iPhone 16 Pro",
} as const satisfies Record<ReleaseE2eProject, keyof typeof devices>

export default defineConfig({
  failOnFlakyTests: isCi,
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isCi,
  globalTimeout: 600_000,
  outputDir: "output/playwright/test-results",
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
  use: {
    actionTimeout: 10_000,
    baseURL: e2eRuntime.learnerOrigin,
    launchOptions: {
      downloadsPath: path.join(e2eRunRoot, "downloads"),
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { height: 720, width: 1280 },
  },
  webServer: createWebServers(),
  workers: 1,
})

function createWebServers() {
  const sharedEnvironment = {
    E2E_RUN_ROOT: e2eRunRoot,
    E2E_RUNTIME: process.env["E2E_RUNTIME"] ?? "development",
  }
  return [
    {
      command: "bun apps/api/src/test-support/start-e2e-api.ts",
      env: sharedEnvironment,
      name: "api",
      reuseExistingServer: false,
      timeout: 120_000,
      url: e2eRuntime.apiOrigin + "/api/health",
    },
    ...(["web", ...(serverScope === "all" ? ["admin"] : [])] as const).map(
      (app) => ({
        command: "bun scripts/start-e2e-frontend.ts " + app,
        env: sharedEnvironment,
        name: app,
        reuseExistingServer: false,
        timeout: 120_000,
        url:
          (app === "web" ? e2eRuntime.learnerOrigin : e2eRuntime.adminOrigin) +
          "/login",
      })
    ),
  ]
}

function readServerScope(): "all" | "learner" {
  const scope = process.env["E2E_SERVER_SCOPE"] ?? "all"
  if (scope !== "all" && scope !== "learner") {
    throw new Error(`지원하지 않는 E2E server scope입니다: ${scope}`)
  }
  return scope
}
