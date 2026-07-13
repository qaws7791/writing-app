import { defineConfig } from "@playwright/test"

import baseConfig from "#playwright-config"

const learnerWebServers = Array.isArray(baseConfig.webServer)
  ? baseConfig.webServer.slice(0, 3)
  : baseConfig.webServer

export default defineConfig({
  ...baseConfig,
  testMatch: "ui-style-seam.visual.spec.ts",
  webServer: learnerWebServers,
})
