import tsconfigPaths from "vite-tsconfig-paths"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "#resource-document": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  ssr: {
    noExternal: ["@workspace/resource-document"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
