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
import { parseApiEnv } from "@/config/env"
import { adminRouteGroupOrder } from "@/http/admin-route-group"
import { createAppLogger } from "@workspace/observability/logger"

import { createLearnerIdentityDirectory } from "@/adapters/auth/learner-identity-directory"

describe("관리자 capability route composition", () => {
  it("하나의 app-owned context로 여섯 capability factory를 매번 독립 조립한다", () => {
    const databaseClient = createInMemoryWritingAppDatabase()

    try {
      const context = createCompositionContext(
        databaseClient.db,
        databaseClient.sqlite
      )
      const first = createAdminCapabilityRouteGroupRegistry(context)
      const second = createAdminCapabilityRouteGroupRegistry(context)
      const routes = createAdminCapabilityRoutes(context)

      expect(Object.keys(first)).toEqual(adminRouteGroupOrder)
      expect(first).not.toBe(second)
      expect(first.aiChat).not.toBe(second.aiChat)
      expect(first.dashboardAnalytics).not.toBe(second.dashboardAnalytics)
      expect(first.content).not.toBe(second.content)
      expect(first.identity).not.toBe(second.identity)
      expect(first.resourceLibrary).not.toBe(second.resourceLibrary)
      expect(first.settings).not.toBe(second.settings)
      expect(Object.values(first).every(Object.isFrozen)).toBe(true)
      expect(
        Object.fromEntries(
          adminRouteGroupOrder.map((group) => [group, first[group].length])
        )
      ).toEqual({
        aiChat: 3,
        content: 7,
        dashboardAnalytics: 3,
        identity: 4,
        resourceLibrary: 14,
        settings: 3,
      })
      expect(
        routes.map((registration) => registration.route.operationId)
      ).toEqual([
        "getAdminAiChatConversations",
        "getAdminAiChatConversation",
        "streamAdminAiChatMessage",
        "getAdminDashboard",
        "getAdminAnalytics",
        "getAdminLessonAnalytics",
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
        "getAdminSettings",
        "updateAdminNoticeSettings",
        "updateAdminLegalSettings",
      ])
      expect(Object.isFrozen(routes)).toBe(true)
    } finally {
      databaseClient.close()
    }
  })
})

function createCompositionContext(
  database: AdminRouteCompositionContext["database"],
  sqlite: Parameters<typeof createResourceLibraryModule>[0]["sqlite"]
): AdminRouteCompositionContext {
  return {
    content: createContentModule({
      clock: { now: () => new Date("2026-07-18T00:00:00.000Z") },
      courseIdGenerator: { next: () => "course-1" as never },
      database,
      eventFailureObserver: () => undefined,
      eventIdGenerator: { next: () => "event-1" },
      eventPublisher: {
        publishCurriculumPublished: async () => ok(undefined),
      },
      resetGuard: { authorize: () => ok(undefined) },
    }),
    database,
    env: parseApiEnv({
      ADMIN_AUTH_SECRET: "admin-test-secret-0123456789abcdef",
      ADMIN_ORIGIN: "http://localhost:3001",
      API_ALLOWED_HOSTS: "localhost:4000,api:4000",
      API_ORIGIN: "http://localhost:4000",
      API_PORT: "4000",
      DATABASE_URL: ":memory:",
      LEARNER_AUTH_SECRET: "learner-test-secret-0123456789abcdef",
      NODE_ENV: "test",
      WEB_ORIGIN: "http://localhost:3000",
    }),
    logger: createAppLogger({ level: "silent" }),
    identity: createIdentityModule({
      clock: { now: () => new Date("2026-07-18T00:00:00.000Z") },
      database,
      eventFailureObserver: () => undefined,
      eventIdGenerator: { next: () => "event-1" },
      eventPublisher: {
        publishUserStatusChanged: async () => ok(undefined),
      },
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
    now: () => new Date("2026-07-18T00:00:00.000Z"),
    resourceLibrary: createResourceLibraryModule({
      actorDirectory: { readActors: async () => [] },
      assetAuditObserver: () => undefined,
      assetIdGenerator: { next: () => "resource-asset-1" as never },
      clock: { now: () => new Date("2026-07-18T00:00:00.000Z") },
      database,
      documentIdGenerator: { next: () => "resource-document-1" as never },
      folderIdGenerator: { next: () => "resource-folder-1" as never },
      sqlite,
      storage: null,
    }),
    sessionResolver: {
      resolveSession: () => Promise.resolve(null),
    },
  }
}
