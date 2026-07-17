import assert from "node:assert/strict"

import { RuleTester } from "oxlint/plugins-dev"

import {
  approvedCoreCrossCapabilityImportMap,
  readCoreCapabilityImportViolation,
} from "../architecture/core-capability-policy.mjs"
import { noInvalidWorkspaceDependencyRule } from "./workspace-rules.mjs"

assert.deepEqual(approvedCoreCrossCapabilityImportMap, {})
assert.deepEqual(
  readCoreCapabilityImportViolation({
    moduleSource: "#core/modules/learning/api",
    sourcePath: "modules/content/application/course.ts",
  }),
  {
    importedCapability: "learning",
    importerCapability: "content",
    moduleSource: "#core/modules/learning/api",
  }
)
assert.equal(
  readCoreCapabilityImportViolation({
    moduleSource: "#core/modules/content/application/course",
    sourcePath: "modules/content/application/course.ts",
  }),
  null
)
assert.equal(
  readCoreCapabilityImportViolation({
    moduleSource: "#core/shared/result",
    sourcePath: "modules/content/application/course.ts",
  }),
  null
)

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
        code: 'import { createWritingAppDatabase } from "@workspace/db"',
        errors: [{ messageId: "apiTransportCannotImportDb" }],
        filename: "/repo/apps/api/src/modules/learning/learning.routes.ts",
      },
      {
        code: 'import { eq } from "drizzle-orm"',
        errors: [{ messageId: "apiTransportCannotImportDrizzle" }],
        filename:
          "/repo/apps/api/src/modules/admin-identity/admin-identity.routes.ts",
      },
      {
        code: 'import { createWritingAppDatabase } from "@workspace/db"',
        errors: [{ messageId: "apiTransportCannotImportDb" }],
        filename: "/repo/apps/api/src/admin/admin-auth.middleware.ts",
      },
      {
        code: 'import { eq } from "drizzle-orm"',
        errors: [{ messageId: "apiTransportCannotImportDrizzle" }],
        filename: "/repo/apps/api/src/admin/admin-openapi.ts",
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
        code: 'import { createWritingAppDatabase } from "@workspace/db"',
        errors: [{ messageId: "browserCannotImportDb" }],
        filename: "apps/web/src/lib/database.ts",
      },
      {
        code: 'import { eq } from "drizzle-orm"',
        errors: [{ messageId: "browserCannotImportDrizzle" }],
        filename: "apps/admin/src/lib/database.ts",
      },
      {
        code: 'export * from "@workspace/core/content"',
        errors: [{ messageId: "contractsCannotImportCore" }],
        filename: "packages/contracts/src/content/index.ts",
      },
      {
        code: 'import { createWritingAppDatabase } from "@workspace/db"',
        errors: [{ messageId: "coreCannotImportDb" }],
        filename: "packages/core/src/runtime.ts",
      },
      {
        code: 'import { eq } from "drizzle-orm"',
        errors: [{ messageId: "coreCannotImportRuntimeFramework" }],
        filename: "packages/core/src/modules/content/repository.ts",
      },
      {
        code: 'import OpenAI from "openai"',
        errors: [{ messageId: "coreCannotImportRuntimeFramework" }],
        filename: "packages/core/src/modules/ai-feedback/provider.ts",
      },
      {
        code: 'import { OpenAPIHono } from "@hono/zod-openapi"',
        errors: [{ messageId: "coreCannotImportRuntimeFramework" }],
        filename: "packages/core/src/modules/content/http.ts",
      },
      {
        code: 'import { Mastra } from "@mastra/core"',
        errors: [{ messageId: "coreCannotImportRuntimeFramework" }],
        filename: "packages/core/src/modules/ai-feedback/agent.ts",
      },
      {
        code: 'import { Button } from "@workspace/ui/components/ui/button"',
        errors: [{ messageId: "coreCannotImportRuntimeFramework" }],
        filename: "packages/core/src/modules/content/presentation.ts",
      },
      {
        code: 'import { completeLearnerStep } from "#core/modules/learning/domain/learner-transition"',
        errors: [{ messageId: "coreCannotImportUnapprovedCapability" }],
        filename:
          "packages/core/src/modules/ai-feedback/application/complete-feedback.ts",
      },
      {
        code: 'import type { LearnerTransitionRepository } from "#core/modules/learning/application/ports/learner-transition.repository"',
        errors: [{ messageId: "coreCannotImportUnapprovedCapability" }],
        filename:
          "packages/core/src/modules/ai-feedback/application/complete-feedback.test.ts",
      },
      {
        code: 'export * from "#core/modules/learning/api"',
        errors: [{ messageId: "coreCannotImportUnapprovedCapability" }],
        filename: "packages/core/src/modules/content/api/index.ts",
      },
      {
        code: 'const learningApi = import("#core/modules/learning/api")',
        errors: [{ messageId: "coreCannotImportUnapprovedCapability" }],
        filename:
          "packages/core/src/modules/content/application/load-learning.ts",
      },
      {
        code: 'type LearningPort = import("#core/modules/learning/application/ports/learner-transition.repository").LearnerTransitionRepository',
        errors: [{ messageId: "coreCannotImportUnapprovedCapability" }],
        filename:
          "packages/core/src/modules/ai-feedback/application/learning-port.ts",
      },
      {
        code: 'import LearningApi = require("#core/modules/learning/api")',
        errors: [{ messageId: "coreCannotImportUnapprovedCapability" }],
        filename:
          "packages/core/src/modules/content/application/learning-api.ts",
      },
      {
        code: 'import { lessonStepDtoSchema } from "@workspace/contracts/learning"',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/learning/lesson-step.ts",
      },
      {
        code: 'import { learnerProgressOverviewDtoSchema } from "@workspace/contracts/learning/learner-read-model"',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/learning/progress.ts",
      },
      {
        code: 'import type { InternalAdminIdentity } from "@workspace/contracts/admin/identity-data/internal"',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/admin/identity.ts",
      },
      {
        code: 'import * as adminContracts from "@workspace/contracts/admin"',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/admin/admin.ts",
      },
      {
        code: 'export { adminUserListItemSchema } from "@workspace/contracts/admin"',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/admin/api/index.ts",
      },
      {
        code: 'export * from "@workspace/contracts/learning/learning.ids"',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/learning/api/index.ts",
      },
      {
        code: 'export * as aiChatContracts from "@workspace/contracts/admin/ai-chat"',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/admin/api/index.ts",
      },
      {
        code: 'const contracts = import("@workspace/contracts/admin/ai-chat")',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/admin/ai-chat.ts",
      },
      {
        code: "const contracts = import(`@workspace/contracts/learning/learner-read-model`)",
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/learning/read-model.ts",
      },
      {
        code: 'type AdminContracts = import("@workspace/contracts/admin").AdminDashboardDto',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/admin/admin.types.ts",
      },
      {
        code: 'import AdminContracts = require("@workspace/contracts/admin")',
        errors: [
          { messageId: "coreCannotImportNonCanonicalCapabilityContract" },
        ],
        filename: "packages/core/src/modules/admin/admin.types.ts",
      },
      {
        code: "const contracts = import(`@workspace/contracts/${capability}`)",
        errors: [{ messageId: "coreCannotUseComputedDynamicImport" }],
        filename: "packages/core/src/modules/shared/contracts.ts",
      },
      {
        code: "const dependency = import(moduleSource)",
        errors: [{ messageId: "coreCannotUseComputedDynamicImport" }],
        filename: "packages/core/src/modules/shared/dependency.ts",
      },
    ],
    valid: [
      {
        code: 'import { createLearningService } from "@workspace/core/learning"',
        filename: "apps/api/src/main.ts",
      },
      {
        code: 'import { createWritingAppDatabase } from "@workspace/db"',
        filename: "apps/api/src/composition/learner-runtime.ts",
      },
      {
        code: 'import { eq } from "drizzle-orm"',
        filename:
          "apps/api/src/adapters/identity/admin-user-drizzle.repository.ts",
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
      {
        code: `
          import type { LearnerStepSubmission } from "@workspace/contracts/learning/step-data"
          import type { CourseProjection } from "@workspace/contracts/learning/read-data"
          import type { AdminCourseDetail } from "@workspace/contracts/admin/content-data"
          import type { AdminUserDetail } from "@workspace/contracts/admin/identity-data"
          import type { AdminDashboardSnapshot } from "@workspace/contracts/admin/dashboard-analytics-data"
          import type { AdminSettingsDto } from "@workspace/contracts/admin/settings-data"
          import type { ConversationId } from "@workspace/contracts/admin/ai-chat-data"
          import type { AdminResourceTree } from "@workspace/contracts/admin/resource-library-data"
        `,
        filename: "packages/core/src/modules/contracts/canonical-data.ts",
      },
      {
        code: `
          const chatData = import("@workspace/contracts/admin/ai-chat-data")
          type StepData = import("@workspace/contracts/learning/step-data").LearnerStepSubmission
        `,
        filename:
          "packages/core/src/modules/contracts/canonical-dynamic-data.ts",
      },
      {
        code: `
          import { contentStatuses } from "@workspace/contracts/status"
          import { courseListDtoSchema } from "@workspace/contracts/content"
          import { createLearningTool } from "@workspace/contracts/learning-tools"
        `,
        filename: "packages/core/src/modules/content/contracts.ts",
      },
      {
        code: `
          import type { CourseAdminRepository } from "#core/modules/content/application/ports/admin-content.repository"
          import { ok } from "#core/shared/result"
        `,
        filename:
          "packages/core/src/modules/content/application/admin-course.test.ts",
      },
      {
        code: 'import { learnerProgressOverviewDtoSchema } from "@workspace/contracts/learning/learner-read-model"',
        filename: "apps/api/src/http/learner-progress.route.ts",
      },
      {
        code: "const contract = import(contractSource)",
        filename: "apps/api/src/composition/contracts.ts",
      },
    ],
  }
)
