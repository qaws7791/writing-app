import { describe, expect, it } from "vitest"
import { createApp } from "@workspace/http-platform/app"
import {
  adminIdSchema,
  userIdSchema,
} from "@workspace/contracts/identity/admin-ids"
import { err, ok } from "@workspace/kernel/result"

import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "#identity/application/identity-sessions"
import type {
  AdminUserDetail,
  AdminUserMutationUseCase,
  AdminUserReader,
} from "#identity/application/identity-queries"
import { registerAdminIdentityRoutes } from "#identity/interface/http/admin-identity-routes"
import type { IdentityAdminHonoEnv } from "#identity/interface/http/admin-auth"
import {
  registerLearnerIdentityRoutes,
  type IdentityLearnerHonoEnv,
} from "#identity/interface/http/learner-identity-routes"

const userId = userIdSchema.parse("user-1")
const adminId = adminIdSchema.parse("admin-1")
const userListItem = {
  email: "learner@example.com",
  id: userId,
  joined: "2026-06-14",
  lastActive: null,
  lessonsDone: 0,
  name: "학습자",
  status: "active",
  streak: 0,
} as const
const user: AdminUserDetail = {
  ...userListItem,
  progressPercent: 0,
  totalLessons: 0,
}

describe("identity HTTP interface", () => {
  it("unauthenticated read를 401로 거절한다", async () => {
    const app = createIdentityHttpFixture()
    const response = await app.request("/users")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })

  it("optimistic conflict를 canonical 409 오류로 exhaustive mapping한다", async () => {
    const app = createIdentityHttpFixture({ conflict: true })
    const response = await app.request("/users/user-1/status", {
      body: JSON.stringify({ status: "suspended" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: "admin=valid",
      },
      method: "PATCH",
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      code: "IDENTITY_CONFLICT",
    })
  })

  it("삭제 marker 기록 실패를 성공으로 숨기지 않고 503으로 반환한다", async () => {
    const app = createIdentityHttpFixture({ markerFailure: true })
    const response = await app.request("/users/user-1", {
      headers: { Cookie: "admin=valid" },
      method: "DELETE",
    })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      code: "IDENTITY_DELETION_MARKER_FAILED",
    })
  })

  it("인증된 read와 관리자 mutation 성공 응답을 canonical schema로 검증한다", async () => {
    const app = createIdentityHttpFixture()
    const listResponse = await app.request("/users?page=1&pageSize=12", {
      headers: { Cookie: "admin=valid" },
    })
    const mutationResponse = await app.request("/users/user-1/status", {
      body: JSON.stringify({ status: "suspended" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: "admin=valid",
      },
      method: "PATCH",
    })

    expect(listResponse.status).toBe(200)
    await expect(listResponse.json()).resolves.toMatchObject({
      items: [{ id: "user-1", status: "active" }],
      pagination: { page: 1, pageSize: 12 },
    })
    expect(mutationResponse.status).toBe(200)
    await expect(mutationResponse.json()).resolves.toMatchObject({
      id: "user-1",
      status: "suspended",
    })
  })
})

describe("identity learner HTTP interface", () => {
  it("unauthenticated와 suspended 제품 identity를 각각 401·403으로 거절한다", async () => {
    const app = createLearnerIdentityHttpFixture()

    const unauthenticated = await app.request("/profile")
    const suspended = await app.request("/profile", {
      headers: { Cookie: "learner=suspended" },
    })

    expect(unauthenticated.status).toBe(401)
    expect(suspended.status).toBe(403)
    expect(suspended.headers.get("Cache-Control")).toBe("private, no-store")
    expect(suspended.headers.get("Vary")).toContain("Cookie")
  })

  it("active 제품 identity의 session과 profile 응답을 canonical schema로 반환한다", async () => {
    const app = createLearnerIdentityHttpFixture()
    const headers = { Cookie: "learner=active" }
    const sessionResponse = await app.request("/auth/session", { headers })
    const profileResponse = await app.request("/profile", { headers })

    expect(sessionResponse.status).toBe(200)
    await expect(sessionResponse.json()).resolves.toMatchObject({
      user: { id: "user-1", status: "active" },
    })
    expect(profileResponse.status).toBe(200)
    expect(profileResponse.headers.get("cache-control")).toContain("no-store")
    await expect(profileResponse.json()).resolves.toMatchObject({
      stats: { completedLessons: 3, totalLessons: 5 },
      user: { id: "user-1", name: "학습자" },
    })
  })

  it("표시 이름 앞뒤 공백을 route 경계에서 정규화해 반영한다", async () => {
    const app = createLearnerIdentityHttpFixture()
    const updated = await app.request("/profile", {
      body: JSON.stringify({ name: "  새 이름  " }),
      headers: {
        "Content-Type": "application/json",
        Cookie: "learner=active",
      },
      method: "PATCH",
    })

    expect(updated.status).toBe(200)
    await expect(updated.json()).resolves.toEqual({ name: "새 이름" })
  })

  it("공백만 남는 표시 이름은 canonical 400으로 거절한다", async () => {
    const app = createLearnerIdentityHttpFixture()
    const invalid = await app.request("/profile", {
      body: JSON.stringify({ name: "   " }),
      headers: {
        "Content-Type": "application/json",
        Cookie: "learner=active",
      },
      method: "PATCH",
    })

    expect(invalid.status).toBe(400)
    await expect(invalid.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
    })
  })
})

function createIdentityHttpFixture(
  input: {
    readonly conflict?: boolean
    readonly markerFailure?: boolean
  } = {}
) {
  const sessionResolver: AdminSessionResolver = {
    async resolveSession(headers) {
      return headers.get("Cookie") === "admin=valid"
        ? {
            admin: {
              email: "owner@example.com",
              id: adminId,
              name: "소유자",
            },
            [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
          }
        : null
    },
  }
  const reader: AdminUserReader = {
    async readUser() {
      return user
    },
    async readUsers(query) {
      return {
        items: [userListItem],
        page: query.page,
        pageSize: query.pageSize,
        totalItems: 1,
        totalPages: 1,
      }
    },
  }
  const mutation: AdminUserMutationUseCase = {
    async deleteUser() {
      return input.markerFailure === true
        ? err({ kind: "identity-deletion-marker-failed" })
        : ok(undefined)
    },
    async updateUserStatus(command) {
      return input.conflict === true
        ? err({ kind: "identity-conflict" })
        : ok({ ...user, status: command.status })
    },
  }

  const app = createApp<IdentityAdminHonoEnv>()
  registerAdminIdentityRoutes(app, {
    sessionResolver,
    userMutationService: mutation,
    userReader: reader,
  })
  return app
}

function createLearnerIdentityHttpFixture() {
  const app = createApp<IdentityLearnerHonoEnv>()
  registerLearnerIdentityRoutes(app, {
    application: {
      async changeLearnerDisplayName(command) {
        return ok({
          deletedAt: null,
          displayName: command.displayName,
          status: "active",
          userId: command.userId,
        })
      },
    },
    profileStatsQuery: {
      async readProfileStats() {
        return {
          completedLessons: 3,
          currentStreakDays: 2,
          lastActiveDate: "2026-07-22",
          progressPercent: 60,
          totalLessons: 5,
        }
      },
    },
    sessionResolver: {
      async resolveSession(headers) {
        const status = headers.get("Cookie")?.split("=")[1]
        if (status !== "active" && status !== "suspended") return null

        return {
          user: {
            email: "learner@example.com",
            id: "user-1",
            image: null,
            joinedAt: "2026-06-14T00:00:00.000Z",
            name: "학습자",
            status,
          },
        }
      },
    },
  })
  return app
}
