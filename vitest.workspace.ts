import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "**/*.d.ts",
        "**/*.generated.*",
        "**/*.stories.*",
        "**/*.test.*",
        "**/*.spec.*",
        "**/index.ts",
        "**/test/**",
      ],
      include: ["apps/*/src/**/*.{ts,tsx}", "packages/*/src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "json-summary", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        "**/auth/**/*.ts": {
          branches: 1,
          functions: 1,
          lines: 1,
          statements: 1,
        },
        "**/*repository*.ts": {
          branches: 1,
          functions: 1,
          lines: 1,
          statements: 1,
        },
        "**/migrations/**/*.ts": {
          branches: 1,
          functions: 1,
          lines: 1,
          statements: 1,
        },
        "**/*sync*.ts": {
          branches: 1,
          functions: 1,
          lines: 1,
          statements: 1,
        },
      },
    },
    projects: [
      "apps/admin/vitest.config.ts",
      "apps/api/vitest.config.ts",
      "apps/web/vitest.config.ts",
      "packages/contracts/vitest.config.ts",
      "packages/core/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "packages/env/vitest.config.ts",
      "packages/http-client/vitest.config.ts",
      "packages/resource-document/vitest.config.ts",
      "packages/repository-tooling/vitest.config.ts",
      "packages/ui/vitest.config.ts",
    ],
  },
})
