import tsconfigPaths from "vite-tsconfig-paths"
import { readFileSync } from "node:fs"
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
  ssr: {
    external: ["bun:sqlite"],
    noExternal: ["zod"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
