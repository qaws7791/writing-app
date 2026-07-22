import { defineConfig } from "vitest/config"

export default defineConfig({
  ssr: { noExternal: ["zod"] },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
})
