import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        branches: 55,
        functions: 65,
        lines: 75,
        statements: 75,
      },
    },
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    testTimeout: 10_000,
  },
})
