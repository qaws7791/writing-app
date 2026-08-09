import path from "node:path"

import { defineConfig, devices } from "@playwright/test"
import { e2eRuntime, readRequiredE2eEnvironment } from "#e2e/runtime"
import {
  releaseE2eProjects,
  releaseE2eTestFiles,
  type ReleaseE2eProject,
} from "#scripts/playwright-release-plan"

const e2eRunRoot = path.resolve(readRequiredE2eEnvironment("E2E_RUN_ROOT"))
const e2eDatabaseUrl = path.resolve(
  readRequiredE2eEnvironment("E2E_DATABASE_URL")
)
const repositoryRoot = process.cwd()
const runtime = readRuntime()
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
    E2E_DATABASE_URL: e2eDatabaseUrl,
    E2E_RUN_ROOT: e2eRunRoot,
  }
  const webServers = [
    {
      command: "bun e2e/fixture-server.ts",
      env: sharedEnvironment,
      name: "fixture",
      reuseExistingServer: false,
      timeout: 120_000,
      url: e2eRuntime.assetOrigin,
    },
    {
      command: "bun apps/api/src/test-support/start-e2e-api.ts",
      env: {
        ...sharedEnvironment,
        ADMIN_AUTH_SECRET: "e2e-admin-auth-secret-must-have-32-characters",
        ADMIN_ORIGIN: e2eRuntime.adminOrigin,
        API_PORT: new URL(e2eRuntime.apiOrigin).port,
        DATABASE_URL: e2eDatabaseUrl,
        GOOGLE_CLIENT_ID: "e2e-google-client.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "e2e-google-client-secret",
        LEARNER_AUTH_SECRET: "e2e-auth-secret-must-have-32-characters",
        NODE_ENV: "test",
        WEB_ORIGIN: e2eRuntime.learnerOrigin,
      },
      name: "api",
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${e2eRuntime.apiOrigin}/api/health`,
    },
    {
      command:
        runtime === "standalone"
          ? "node scripts/run-next-standalone.mjs web"
          : "node node_modules/next/dist/bin/next dev --hostname localhost --port 3100",
      cwd:
        runtime === "standalone"
          ? repositoryRoot
          : path.join(repositoryRoot, "apps/web"),
      env: {
        ...sharedEnvironment,
        API_BASE_URL: e2eRuntime.apiOrigin,
        CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: e2eRuntime.assetOrigin,
        CONTENT_ASSET_PUBLIC_BASE_URL: `${e2eRuntime.assetOrigin}/content-assets`,
        HOSTNAME: "localhost",
        ...(runtime === "standalone" ? { NODE_ENV: "production" } : {}),
        PORT: new URL(e2eRuntime.learnerOrigin).port,
        WEB_ORIGIN: e2eRuntime.learnerOrigin,
      },
      name: "learner web",
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${e2eRuntime.learnerOrigin}/login`,
    },
  ]

  if (serverScope === "learner") return webServers
  return [
    ...webServers,
    {
      command:
        runtime === "standalone"
          ? "node scripts/run-next-standalone.mjs admin"
          : "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3101",
      cwd:
        runtime === "standalone"
          ? repositoryRoot
          : path.join(repositoryRoot, "apps/admin"),
      env: {
        ...sharedEnvironment,
        ADMIN_ORIGIN: e2eRuntime.adminOrigin,
        API_BASE_URL: e2eRuntime.apiOrigin,
        CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: e2eRuntime.assetOrigin,
        CONTENT_ASSET_PUBLIC_BASE_URL: `${e2eRuntime.assetOrigin}/content-assets`,
        HOSTNAME: "127.0.0.1",
        NEXT_PUBLIC_LEARNER_WEB_ORIGIN: e2eRuntime.learnerOrigin,
        ...(runtime === "standalone" ? { NODE_ENV: "production" } : {}),
        PORT: new URL(e2eRuntime.adminOrigin).port,
      },
      name: "admin web",
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${e2eRuntime.adminOrigin}/login`,
    },
  ]
}

function readRuntime(): "development" | "standalone" {
  const runtime = process.env["E2E_RUNTIME"] ?? "development"
  if (runtime !== "development" && runtime !== "standalone") {
    throw new Error(`지원하지 않는 E2E runtime입니다: ${runtime}`)
  }
  return runtime
}

function readServerScope(): "all" | "learner" {
  const scope = process.env["E2E_SERVER_SCOPE"] ?? "all"
  if (scope !== "all" && scope !== "learner") {
    throw new Error(`지원하지 않는 E2E server scope입니다: ${scope}`)
  }
  return scope
}
