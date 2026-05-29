import path from "node:path"
import { fileURLToPath } from "node:url"

import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const reactPath = path.resolve(__dirname, "node_modules/react")
const reactDomPath = path.resolve(__dirname, "node_modules/react-dom")

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: [
      { find: /^react$/, replacement: reactPath },
      { find: /^react-dom$/, replacement: reactDomPath },
      { find: /^react\/(.*)/, replacement: `${reactPath}/$1` },
      { find: /^react-dom\/(.*)/, replacement: `${reactDomPath}/$1` },
    ],
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})
