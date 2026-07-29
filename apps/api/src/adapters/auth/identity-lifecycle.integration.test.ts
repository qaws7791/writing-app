import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { authSessions } from "@workspace/auth/schema"
import {
  adminIdSchema,
  userIdSchema,
} from "@workspace/contracts/identity/admin-ids"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { createApp } from "@workspace/http-platform/app"
import {
  registerAdminIdentityRoutes,
  registerLearnerIdentityRoutes,
  type IdentityAdminHonoEnv,
  type IdentityLearnerHonoEnv,
} from "@workspace/identity/http"
import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "@workspace/identity/ports"

import { composeIdentityModule } from "@/composition/identity-module.composition"
import { runApplicationMigrations } from "@/db/migrate"

const now = new Date("2026-07-24T12:00:00.000Z")
const userId = userIdSchema.parse("user-1")

describe("identity 삭제 lifecycle Hono integration", () => {
  it("삭제 command가 session을 폐기하고 deleted 사용자를 읽기 전용으로 만든다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)
      seedActiveLearner(client.sqlite)
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
      const adminSession = adminSessionResolver()
      const adminApp = createApp<IdentityAdminHonoEnv>()
      registerAdminIdentityRoutes(adminApp, {
        sessionResolver: adminSession,
        userMutationService: identity.adminUserMutation,
        userReader: identity.adminUserReader,
      })
      const learnerSessionResolver = identity.createLearnerSessionResolver({
        async resolveIdentity(headers) {
          const token = readCookie(headers, "learner_session_token")
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
            joinedAt: new Date("2026-07-01T00:00:00.000Z"),
            name: "학습자",
          }
        },
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
        sessionResolver: learnerSessionResolver,
      })
      const learnerHeaders = {
        Cookie: "learner_session_token=learner-token",
      }

      expect(
        (await learnerApp.request("/profile", { headers: learnerHeaders }))
          .status
      ).toBe(200)

      const deleted = await adminApp.request("/users/user-1", {
        headers: { Cookie: "admin=valid" },
        method: "DELETE",
      })

      expect(deleted.status).toBe(200)
      expect(client.db.select().from(authSessions).all()).toEqual([])
      expect(
        client.sqlite
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
      ).toMatchObject({
        deletedAt: now.getTime(),
        displayName: "삭제된 사용자",
        status: "deleted",
      })
      expect(
        (await learnerApp.request("/profile", { headers: learnerHeaders }))
          .status
      ).toBe(401)

      const detail = await adminApp.request("/users/user-1", {
        headers: { Cookie: "admin=valid" },
      })
      expect(detail.status).toBe(200)
      await expect(detail.json()).resolves.toMatchObject({
        email: "deleted@example.invalid",
        id: "user-1",
        status: "deleted",
      })

      for (const request of [
        new Request("http://localhost/users/user-1/status", {
          body: JSON.stringify({ status: "active" }),
          headers: {
            "Content-Type": "application/json",
            Cookie: "admin=valid",
          },
          method: "PATCH",
        }),
        new Request("http://localhost/users/user-1", {
          headers: { Cookie: "admin=valid" },
          method: "DELETE",
        }),
      ]) {
        expect((await adminApp.request(request)).status).toBe(409)
      }
    } finally {
      client.close()
    }
  })
})

function adminSessionResolver(): AdminSessionResolver {
  return {
    async resolveSession(headers) {
      if (headers.get("Cookie") !== "admin=valid") return null
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

function seedActiveLearner(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    INSERT INTO user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES (
      'user-1', '학습자', 'learner@example.test', 1, NULL,
      1782864000000, 1782864000000
    );
    INSERT INTO learner_profiles (
      user_id, status, display_name, deleted_at, version
    ) VALUES ('user-1', 'active', '학습자', NULL, 0);
    INSERT INTO session (
      id, user_id, token, expires_at, created_at, updated_at
    ) VALUES (
      'session-1', 'user-1', 'learner-token', 4102444800000,
      1782864000000, 1782864000000
    );
  `)
}

function readCookie(headers: Headers, name: string): string | null {
  const cookie = headers.get("Cookie")
  if (cookie === null) return null

  return (
    cookie
      .split(";")
      .map((part) => part.trim().split("=") as [string, string])
      .find(([key]) => key === name)?.[1] ?? null
  )
}
