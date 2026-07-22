import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import {
  createAdminCapabilityRouteGroupRegistry,
  createAdminCapabilityRoutes,
  type AdminRouteCompositionContext,
} from "@/composition/admin-route-composition"
import { parseApiEnv } from "@/config/env"
import { adminRouteGroupOrder } from "@/http/admin-route-group"
import { createAppLogger } from "@workspace/observability/logger"

describe("관리자 capability route composition", () => {
  it("하나의 app-owned context로 여섯 capability factory를 매번 독립 조립한다", () => {
    const databaseClient = createInMemoryWritingAppDatabase()

    try {
      const context = createCompositionContext(databaseClient.db)
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
        content: 6,
        dashboardAnalytics: 3,
        identity: 4,
        resourceLibrary: 14,
        settings: 4,
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
        "resetAdminContent",
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
    now: () => new Date("2026-07-18T00:00:00.000Z"),
    sessionResolver: {
      resolveSession: () => Promise.resolve(null),
    },
  }
}
