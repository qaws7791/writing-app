import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { authSessions } from "@workspace/auth/schema"
import {
  adminIdSchema,
  userIdSchema,
} from "@workspace/contracts/identity/admin-ids"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { createApp } from "@workspace/http-platform/app"
import {
  registerAdminIdentityRoutes,
  registerLearnerIdentityRoutes,
  type IdentityAdminHonoEnv,
  type IdentityLearnerHonoEnv,
} from "@workspace/identity/http"
import {
  adminSessionExpiresAt,
  deletedLearnerDisplayName,
  type AdminSessionResolver,
} from "@workspace/identity/ports"
import { aLearner } from "@workspace/identity/test-fixtures"

import { composeIdentityModule } from "@/composition/identity-module.composition"
import { runApplicationMigrations } from "@/db/migrate"
import {
  learnerSessionCookieHeader,
  readLearnerSessionToken,
} from "@/test-support/learner-session-cookie"

const now = new Date("2026-07-24T12:00:00.000Z")
const learnerCreatedAt = new Date("2026-06-30T00:00:00.000Z")
const userId = userIdSchema.parse("user-1")
const adminHeaders = { Cookie: "admin=valid" } as const
const learnerHeaders = {
  Cookie: learnerSessionCookieHeader("learner-token"),
} as const

type IdentityLifecycleFixture = Readonly<{
  adminApp: ReturnType<typeof createApp<IdentityAdminHonoEnv>>
  learnerApp: ReturnType<typeof createApp<IdentityLearnerHonoEnv>>
}>

describe("identity 삭제 lifecycle Hono integration", () => {
  it("삭제 command가 학습자 session을 전량 폐기하고 profile을 deleted로 표시한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      const { adminApp, learnerApp } = openIdentityLifecycle(client)
      expect(
        (await learnerApp.request("/profile", { headers: learnerHeaders }))
          .status
      ).toBe(200)

      const deleted = await adminApp.request("/users/user-1", {
        headers: adminHeaders,
        method: "DELETE",
      })

      expect(deleted.status).toBe(200)
      expect(client.db.select().from(authSessions).all()).toEqual([])
      expect(readLearnerProfile(client)).toMatchObject({
        deletedAt: now.getTime(),
        displayName: deletedLearnerDisplayName,
        status: "deleted",
      })
    } finally {
      client.close()
    }
  })

  it("deleted 학습자는 자기 profile을 읽지 못하고 관리자 상세는 마스킹되며 재변경은 409다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      const { adminApp, learnerApp } = openIdentityLifecycle(client)
      await adminApp.request("/users/user-1", {
        headers: adminHeaders,
        method: "DELETE",
      })

      expect(
        (await learnerApp.request("/profile", { headers: learnerHeaders }))
          .status
      ).toBe(401)

      const detail = await adminApp.request("/users/user-1", {
        headers: adminHeaders,
      })
      expect(detail.status).toBe(200)
      await expect(detail.json()).resolves.toMatchObject({
        email: "deleted@example.invalid",
        id: "user-1",
        status: "deleted",
      })

      const reactivated = await adminApp.request(
        "/users/user-1/status",
        statusChangeRequestInit()
      )
      const redeleted = await adminApp.request("/users/user-1", {
        headers: adminHeaders,
        method: "DELETE",
      })
      expect([reactivated.status, redeleted.status]).toEqual([409, 409])
    } finally {
      client.close()
    }
  })
})

function openIdentityLifecycle(
  client: WritingAppDatabaseClient
): IdentityLifecycleFixture {
  runApplicationMigrations(client.sqlite)
  seedActiveLearner(client)
  const identity = composeIdentityModule({
    clock: { now: () => now },
    database: client.db,
    learningReport: {
      async readActiveLessonCount() {
        return 0
      },
      async readLearnerReports() {
        return []
      },
    },
  })
  const adminApp = createApp<IdentityAdminHonoEnv>()
  registerAdminIdentityRoutes(adminApp, {
    sessionResolver: adminSessionResolver(),
    userMutationService: identity.adminUserMutation,
    userReader: identity.adminUserReader,
  })
  const learnerApp = createApp<IdentityLearnerHonoEnv>()
  registerLearnerIdentityRoutes(learnerApp, {
    application: identity.application,
    profileStatsQuery: {
      async readProfileStats() {
        return {
          completedLessons: 0,
          currentStreakDays: 0,
          lastActiveDate: null,
          progressPercent: 0,
          totalLessons: 0,
        }
      },
    },
    sessionResolver: identity.createLearnerSessionResolver({
      async resolveIdentity(headers) {
        const token = readLearnerSessionToken(headers)
        if (token === null) return null
        const session = client.db
          .select({ userId: authSessions.userId })
          .from(authSessions)
          .where(eq(authSessions.token, token))
          .get()
        if (session?.userId !== userId) return null

        return {
          email: "learner@example.test",
          id: userId,
          image: null,
          joinedAt: learnerCreatedAt,
          name: "학습자",
        }
      },
    }),
  })

  return { adminApp, learnerApp }
}

function statusChangeRequestInit(): RequestInit {
  return {
    body: JSON.stringify({ status: "active" }),
    headers: {
      ...adminHeaders,
      "Content-Type": "application/json",
    },
    method: "PATCH",
  }
}

function adminSessionResolver(): AdminSessionResolver {
  return {
    async resolveSession(headers) {
      if (headers.get("Cookie") !== adminHeaders.Cookie) return null
      return {
        admin: {
          email: "owner@example.test",
          id: adminIdSchema.parse("admin-1"),
          name: "소유자",
        },
        [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
      }
    },
  }
}

function seedActiveLearner(client: WritingAppDatabaseClient): void {
  aLearner(client.sqlite, {
    createdAt: learnerCreatedAt.getTime(),
    displayName: "학습자",
    email: "learner@example.test",
    id: "user-1",
    name: "학습자",
    sessionId: "session-1",
    sessionToken: "learner-token",
    status: "active",
  })
}

function readLearnerProfile(client: WritingAppDatabaseClient) {
  return client.sqlite
    .query<
      {
        readonly deletedAt: number | null
        readonly displayName: string
        readonly status: string
      },
      [string]
    >(
      `SELECT deleted_at AS deletedAt, display_name AS displayName, status
       FROM learner_profiles WHERE user_id = ?`
    )
    .get(userId)
}
