import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      thresholds: {
        branches: 85,
        functions: 100,
        lines: 95,
        statements: 95,
      },
    },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
