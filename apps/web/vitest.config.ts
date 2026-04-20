import { fileURLToPath } from "node:url"

import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig } from "vitest/config"

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url))

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      thresholds: {
        branches: 45,
        functions: 100,
        lines: 70,
        statements: 70,
      },
    },
    css: true,
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/**"],
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    restoreMocks: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
})
