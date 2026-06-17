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
