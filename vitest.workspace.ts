import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      "apps/api/vitest.config.ts",
      "apps/web/vitest.config.ts",
      "packages/core/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "packages/env/vitest.config.ts",
      "packages/logger/vitest.config.ts",
      "packages/ui/vitest.config.ts",
    ],
  },
})
