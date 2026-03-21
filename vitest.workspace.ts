import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
  "apps/api/vitest.config.ts",
  "apps/web/vitest.config.ts",
  "packages/backend-core/vitest.config.ts",
  "packages/database/vitest.config.ts",
])
