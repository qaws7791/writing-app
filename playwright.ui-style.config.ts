import { defineConfig, devices } from "@playwright/test"

import baseConfig from "#playwright-config"

export default defineConfig({
  ...baseConfig,
  projects: [
    {
      name: "chromium-latest",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  testIgnore: [],
  testMatch: ["theme-surfaces.visual.spec.ts", "ui-style-seam.visual.spec.ts"],
})
