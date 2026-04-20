import { fileURLToPath } from "node:url"

import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url))

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
    coverage: {
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    restoreMocks: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
})
