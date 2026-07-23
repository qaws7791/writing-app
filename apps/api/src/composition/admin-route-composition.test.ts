import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { createIdentityModule } from "@workspace/identity/module"
import { createContentModule } from "@workspace/content/module"
import { ok } from "@workspace/kernel/result"
import { createResourceLibraryModule } from "@workspace/resource-library/module"

import {
  createAdminCapabilityRouteGroupRegistry,
  createAdminCapabilityRoutes,
  type AdminRouteCompositionContext,
} from "@/composition/admin-route-composition"
import { adminRouteGroupOrder } from "@/http/admin-route-group"
import { createAppLogger } from "@workspace/observability/logger"

import { createLearnerIdentityDirectory } from "@/adapters/auth/learner-identity-directory"

describe("관리자 capability route composition", () => {
  it("하나의 app-owned context로 네 capability factory를 매번 독립 조립한다", async () => {
    const databaseClient = createInMemoryWritingAppDatabase()

    try {
      const context = createCompositionContext(databaseClient.db)
      const first = createAdminCapabilityRouteGroupRegistry(context)
      const second = createAdminCapabilityRouteGroupRegistry(context)
      const routes = createAdminCapabilityRoutes(context)

      expect(Object.keys(first)).toEqual(adminRouteGroupOrder)
      expect(first).not.toBe(second)
      expect(first.content).not.toBe(second.content)
      expect(first.identity).not.toBe(second.identity)
      expect(first.operations).not.toBe(second.operations)
      expect(first.resourceLibrary).not.toBe(second.resourceLibrary)
      expect(Object.values(first).every(Object.isFrozen)).toBe(true)
      expect(
        Object.fromEntries(
          adminRouteGroupOrder.map((group) => [group, first[group].length])
        )
      ).toEqual({
        content: 7,
        identity: 4,
        operations: 12,
        resourceLibrary: 14,
      })
      expect(
        routes.map((registration) => registration.route.operationId)
      ).toEqual([
        "getAdminCourses",
        "createAdminCourse",
        "archiveAdminCourse",
        "getAdminCourseEditor",
        "saveAdminCourseEditor",
        "publishAdminCourse",
        "resetAdminContent",
        "getAdminUsers",
        "getAdminUser",
        "updateAdminUserStatus",
        "deleteAdminUser",
        "getAdminAiChatConversations",
        "getAdminAiChatConversation",
        "streamAdminAiChatMessage",
        "getAdminAiChangeProposal",
        "approveAdminAiChangeProposal",
        "rejectAdminAiChangeProposal",
        "getAdminDashboard",
        "getAdminAnalytics",
        "getAdminLessonAnalytics",
        "getAdminSettings",
        "updateAdminNoticeSettings",
        "updateAdminLegalSettings",
        "getAdminResourceTree",
        "createAdminResourceFolder",
        "createAdminResourceDocumentNode",
        "renameAdminResourceFolder",
        "moveAdminResourceNode",
        "trashAdminResourceNode",
        "restoreAdminResourceNode",
        "deleteAdminResourceNodePermanently",
        "getAdminResourceLibraryDocument",
        "saveAdminResourceLibraryDocument",
        "importAdminResourceLibraryDocument",
        "exportAdminResourceLibraryDocument",
        "uploadAdminResourceLibraryImage",
        "searchAdminResourceLibrary",
      ])
      expect(Object.isFrozen(routes)).toBe(true)
    } finally {
      databaseClient.close()
    }
  })
})

function createCompositionContext(
  database: AdminRouteCompositionContext["database"]
): AdminRouteCompositionContext {
  return {
    aiConfig: null,
    clock: { now: () => new Date("2026-07-18T00:00:00.000Z") },
    content: createContentModule({
      clock: { now: () => new Date("2026-07-18T00:00:00.000Z") },
      courseIdGenerator: { next: () => "course-1" as never },
      database,
      resetGuard: { authorize: () => ok(undefined) },
    }),
    database,
    logger: createAppLogger({ level: "silent" }),
    identity: createIdentityModule({
      clock: { now: () => new Date("2026-07-18T00:00:00.000Z") },
      database,
      learningReport: {
        readActiveLessonCount: async () => 0,
        readLearnerReports: async () => [],
      },
      learnerIdentityDirectory: createLearnerIdentityDirectory(database),
      sessionRevocation: {
        revokeAdminSessions: async () => ok(undefined),
        revokeLearnerSessions: async () => ok(undefined),
      },
    }),
    learningReporting: {
      readActiveLessonCount: async () => 0,
      readLearnerReports: async () => [],
      readOperationsReport: async () => ({
        learnerActivities: [],
        lessonProgress: [],
      }),
    },
    proposalIdGenerator: {
      next: () => "operations-ai-proposal-1" as never,
    },
    resourceLibrary: createResourceLibraryModule({
      actorDirectory: { readActors: async () => [] },
      assetAuditObserver: () => undefined,
      assetIdGenerator: { next: () => "resource-asset-1" as never },
      clock: { now: () => new Date("2026-07-18T00:00:00.000Z") },
      database,
      documentIdGenerator: { next: () => "resource-document-1" as never },
      folderIdGenerator: { next: () => "resource-folder-1" as never },
      storage: null,
    }),
    sessionResolver: {
      resolveSession: () => Promise.resolve(null),
    },
  }
}
