import path from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

const repositoryRoot = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  test: {
    projects: [
      path.join(repositoryRoot, "apps/admin/vitest.config.ts"),
      path.join(repositoryRoot, "apps/api/vitest.config.ts"),
      path.join(repositoryRoot, "apps/web/vitest.config.ts"),
      path.join(repositoryRoot, "packages/shared/ui/vitest.config.ts"),
      ...[
        ["@workspace/ai-feedback", "packages/modules/ai-feedback"],
        ["@workspace/auth", "packages/infra/auth"],
        ["@workspace/content", "packages/modules/content"],
        ["@workspace/contracts", "packages/shared/contracts"],
        ["@workspace/db", "packages/infra/db"],
        ["@workspace/env", "packages/config/env"],
        ["@workspace/http-platform", "packages/infra/http-platform"],
        ["@workspace/identity", "packages/modules/identity"],
        ["@workspace/learning", "packages/modules/learning"],
        ["@workspace/nextjs-config", "packages/config/nextjs-config"],
        ["@workspace/observability", "packages/infra/observability"],
        ["@workspace/vitest-config", "packages/config/vitest-config"],
        ["@workspace/operations", "packages/modules/operations"],
        ["@workspace/storage", "packages/infra/storage"],
        ["@workspace/writing", "packages/modules/writing"],
      ].map(([name, root]) => ({
        plugins: [
          tsconfigPaths({
            projects: [path.join(repositoryRoot, root, "tsconfig.json")],
          }),
        ],
        root: path.join(repositoryRoot, root),
        ssr: {
          external: ["bun:sqlite"],
          noExternal: ["zod"],
        },
        test: {
          environment: "node",
          include: ["src/**/*.test.ts"],
          name,
          unstubEnvs: true,
          unstubGlobals: true,
        },
      })),
    ],
  },
})
