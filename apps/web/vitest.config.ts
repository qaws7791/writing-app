import { createRequire } from "node:module"

import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

const require = createRequire(import.meta.url)

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: [
      {
        find: "react/jsx-dev-runtime",
        replacement: require.resolve("react/jsx-dev-runtime"),
      },
      {
        find: "react/jsx-runtime",
        replacement: require.resolve("react/jsx-runtime"),
      },
      {
        find: "react-dom/client",
        replacement: require.resolve("react-dom/client"),
      },
      { find: "react-dom", replacement: require.resolve("react-dom") },
      { find: "react", replacement: require.resolve("react") },
    ],
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "test/**/*.test.ts",
      "test/**/*.test.tsx",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
})
