import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      "apps/{admin,api,web}/vitest.config.ts",
      "packages/{config,infra,modules,shared}/*/vitest.config.ts",
    ],
  },
})
