import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  ssr: {
    noExternal: ["zod"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
