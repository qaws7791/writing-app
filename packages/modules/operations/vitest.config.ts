import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  ssr: {
    external: ["bun:sqlite"],
    noExternal: ["zod"],
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
})
