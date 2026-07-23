import tsconfigPaths from "vite-tsconfig-paths"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [
    {
      enforce: "pre",
      load(id) {
        if (!id.endsWith(".sql")) return null
        return `export default ${JSON.stringify(readFileSync(id, "utf8"))}`
      },
      name: "sql-text-import",
    },
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "#resource-document": fileURLToPath(
        new URL("../../packages/shared/resource-document/src", import.meta.url)
      ),
    },
  },
  ssr: {
    external: ["bun:sqlite"],
    noExternal: ["@workspace/resource-document", "zod"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
