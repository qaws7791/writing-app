import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        branches: 65,
        functions: 90,
        lines: 80,
        statements: 80,
      },
    },
    passWithNoTests: true,
    globals: true,
    environment: "node",
  },
})
