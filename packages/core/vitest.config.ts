import tsconfigPaths from "vite-tsconfig-paths"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "#resource-document": fileURLToPath(
        new URL("../resource-document/src", import.meta.url)
      ),
    },
  },
  ssr: {
    external: ["bun:sqlite"],
    noExternal: ["@workspace/resource-document", "zod"],
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
