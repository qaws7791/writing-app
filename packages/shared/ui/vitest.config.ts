import { fileURLToPath } from "node:url"

import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const workspaceRoot = fileURLToPath(new URL("../../..", import.meta.url))

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  plugins: [tsconfigPaths()],
  test: {
    clearMocks: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    restoreMocks: true,
    setupFiles: ["./vitest.setup.ts"],
    unstubEnvs: true,
    unstubGlobals: true,
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
})
