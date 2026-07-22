import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  ssr: {
    external: ["bun:sqlite"],
    noExternal: ["zod"],
  },
  test: {
    coverage: {
      thresholds: {
        branches: 1,
        functions: 1,
        lines: 1,
        statements: 1,
      },
    },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
