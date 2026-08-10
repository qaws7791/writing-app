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
  registerLearnerIdentityRoutes,
  type IdentityLearnerHonoEnv,
} from "@workspace/identity/http"
import { createIdentityModule } from "@workspace/identity/module"
import {
  defaultDeletedLearnerRetentionDays,
  type DeletedLearnerPurgeRepository,
  type IdentitySessionRevocationPort,
  type LearnerDeletionMarkerStorePort,
} from "@workspace/identity/ports"
import { aLearner } from "@workspace/identity/test-fixtures"
import { err, ok } from "@workspace/kernel/result"

import { createIdentitySessionRevocation } from "@/adapters/auth/identity-session-revocation"
import { createLearnerIdentityDirectory } from "@/adapters/auth/learner-identity-directory"
import { runApplicationMigrations } from "@/db/migrate"
import {
  learnerSessionCookieHeader,
  readLearnerSessionToken,
} from "@/test-support/learner-session-cookie"

const now = new Date("2026-07-24T12:00:00.000Z")
const learnerCreatedAt = new Date("2026-06-30T00:00:00.000Z")
const userId = userIdSchema.parse("user-1")
const adminId = adminIdSchema.parse("admin-1")
const learnerHeaders = {
  Cookie: learnerSessionCookieHeader("learner-token"),
} as const

describe("identity 삭제 lifecycle", () => {
  it("삭제 marker 기록 실패 시 profile과 session을 변경하지 않는다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      prepareActiveLearner(client)
      const identity = createIdentityFixture(client, {
        recordDeletionMarker: async () =>
          err({ kind: "deletion-marker-storage-failed" }),
        revokeLearnerSessions: createIdentitySessionRevocation(client.db)
          .revokeLearnerSessions,
      })
      const before = readIdentityState(client)

      const result = await identity.adminUserMutation.deleteUser({
        actor: { id: adminId },
        userId,
      })

      expect(result).toEqual(err({ kind: "identity-deletion-marker-failed" }))
      expect(readIdentityState(client)).toEqual(before)
    } finally {
      client.close()
    }
  })

  it("session 폐기 실패 후 남은 cookie의 보호 route 접근을 거절한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      prepareActiveLearner(client)
      const identity = createIdentityFixture(client, {
        recordDeletionMarker: async () => ok(undefined),
        revokeLearnerSessions: async () =>
          err({ kind: "session-revocation-failed" }),
      })

      const result = await identity.adminUserMutation.deleteUser({
        actor: { id: adminId },
        userId,
      })
      const learnerApp = createLearnerIdentityApp(client, identity)
      const protectedResponse = await learnerApp.request("/profile", {
        headers: learnerHeaders,
      })

      expect(result).toEqual(
        err({ kind: "identity-session-revocation-failed" })
      )
      expect(readIdentityState(client)).toMatchObject({
        sessionCount: 1,
        status: "deleted",
      })
      expect(protectedResponse.status).toBe(403)
    } finally {
      client.close()
    }
  })
})

function prepareActiveLearner(client: WritingAppDatabaseClient): void {
  runApplicationMigrations(client.sqlite)
  aLearner(client.sqlite, {
    createdAt: learnerCreatedAt.getTime(),
    displayName: "학습자",
    email: "learner@example.test",
    id: userId,
    name: "학습자",
    sessionId: "session-1",
    sessionToken: "learner-token",
    status: "active",
    version: 0,
  })
}

function createIdentityFixture(
  client: WritingAppDatabaseClient,
  input: Readonly<{
    recordDeletionMarker: LearnerDeletionMarkerStorePort["record"]
    revokeLearnerSessions: IdentitySessionRevocationPort["revokeLearnerSessions"]
  }>
) {
  return createIdentityModule({
    clock: { now: () => now },
    database: client.db,
    deletedLearnerPurgeRepository: emptyDeletedLearnerPurgeRepository,
    deletedLearnerRetentionDays: defaultDeletedLearnerRetentionDays,
    deletionMarkerStore: { record: input.recordDeletionMarker },
    learningReport: {
      async readActiveLessonCount() {
        return 0
      },
      async readLearnerReports() {
        return []
      },
    },
    learnerIdentityDirectory: createLearnerIdentityDirectory(client.db),
    sessionRevocation: {
      revokeLearnerSessions: input.revokeLearnerSessions,
    },
  })
}

const emptyDeletedLearnerPurgeRepository = {
  async purgeDeletedBefore() {
    return ok({ matchedUserCount: 0, purgedUserCount: 0 })
  },
} satisfies DeletedLearnerPurgeRepository

function createLearnerIdentityApp(
  client: WritingAppDatabaseClient,
  identity: ReturnType<typeof createIdentityFixture>
) {
  const app = createApp<IdentityLearnerHonoEnv>()
  registerLearnerIdentityRoutes(app, {
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
  return app
}

function readIdentityState(client: WritingAppDatabaseClient) {
  const profile = client.sqlite
    .query<
      {
        readonly deletedAt: number | null
        readonly displayName: string
        readonly status: string
        readonly version: number
      },
      [string]
    >(
      `SELECT deleted_at AS deletedAt, display_name AS displayName, status, version
       FROM learner_profiles WHERE user_id = ?`
    )
    .get(userId)
  const sessionCount =
    client.sqlite
      .query<{ readonly value: number }, [string]>(
        "SELECT COUNT(*) AS value FROM session WHERE user_id = ?"
      )
      .get(userId)?.value ?? 0

  return { ...profile, sessionCount }
}
