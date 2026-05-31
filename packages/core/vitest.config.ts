import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      thresholds: {
        branches: 55,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
