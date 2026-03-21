import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
  "apps/api/vitest.config.ts",
  "apps/web/vitest.config.ts",
  "packages/application/vitest.config.ts",
  "packages/db/vitest.config.ts",
  "packages/domain/vitest.config.ts",
])
