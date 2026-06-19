import { RuleTester } from "oxlint/plugins-dev"

import { noInvalidWorkspaceDependencyRule } from "./workspace-rules.mjs"

const tester = new RuleTester({
  languageOptions: {
    sourceType: "module",
  },
})

tester.run(
  "no-invalid-workspace-dependency",
  noInvalidWorkspaceDependencyRule,
  {
    invalid: [
      {
        code: 'import { createKwepDatabase } from "@workspace/db"',
        errors: [{ messageId: "apiCannotImportDb" }],
        filename: "apps/api/src/main.ts",
      },
      {
        code: 'import { eq } from "drizzle-orm"',
        errors: [{ messageId: "apiCannotImportDrizzle" }],
        filename: "apps/api/src/main.ts",
      },
      {
        code: 'import { contentStatuses } from "@workspace/core/status"',
        errors: [{ messageId: "dbCannotImportCore" }],
        filename: "packages/db/src/schema/content.schema.ts",
      },
      {
        code: 'import { courseListDtoSchema } from "@workspace/core/content"',
        errors: [{ messageId: "browserCannotImportCore" }],
        filename: "apps/web/src/lib/api.ts",
      },
      {
        code: 'import type { AdminDashboardDto } from "@workspace/core/admin"',
        errors: [{ messageId: "browserCannotImportCore" }],
        filename: "apps/admin/src/lib/api.ts",
      },
      {
        code: 'export * from "@workspace/core/content"',
        errors: [{ messageId: "contractsCannotImportCore" }],
        filename: "packages/contracts/src/content/index.ts",
      },
    ],
    valid: [
      {
        code: 'import { createLearningService } from "@workspace/core/learning"',
        filename: "apps/api/src/main.ts",
      },
      {
        code: 'import { createKwepDatabase } from "@workspace/db"',
        filename: "packages/core/src/runtime.ts",
      },
      {
        code: 'import { sqliteTable } from "drizzle-orm/sqlite-core"',
        filename: "packages/db/src/schema/content.schema.ts",
      },
      {
        code: 'import { courseListDtoSchema } from "@workspace/contracts/content"',
        filename: "apps/web/src/lib/auth.ts",
      },
      {
        code: 'import type { AdminDashboardDto } from "@workspace/contracts/admin"',
        filename: "apps/admin/src/lib/api.ts",
      },
    ],
  }
)
