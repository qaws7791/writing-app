import { describe, expect, it } from "vitest"
import { createApp } from "@workspace/http-platform/core"
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
import { createAdminIdentityRoutes } from "#identity/interface/http/admin-identity-routes"
import { createLearnerIdentityRoutes } from "#identity/interface/http/learner-identity-routes"

const userId = userIdSchema.parse("user-1")
const ownerId = adminIdSchema.parse("owner-1")
const user: AdminUserDetail = {
  email: "learner@example.com",
  id: userId,
  joined: "2026-06-14",
  lastActive: null,
  lessonsDone: 0,
  name: "학습자",
  progressPercent: 0,
  status: "active",
  streak: 0,
  totalLessons: 0,
}

describe("identity HTTP interface", () => {
  it("unauthenticated read를 401로 거절한다", async () => {
    const app = createIdentityHttpFixture({ role: "owner" })
    const response = await app.request("/users")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })

  it("operator mutation을 403으로 거절한다", async () => {
    const app = createIdentityHttpFixture({ role: "operator" })
    const response = await app.request("/users/user-1/status", {
      body: JSON.stringify({ status: "suspended" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: "admin=valid",
      },
      method: "PATCH",
    })

    expect(response.status).toBe(403)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toContain("Cookie")
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" })
  })

  it("optimistic conflict를 canonical 409 오류로 exhaustive mapping한다", async () => {
    const app = createIdentityHttpFixture({ conflict: true, role: "owner" })
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

  it("인증된 read와 owner mutation 성공 응답을 canonical schema로 검증한다", async () => {
    const app = createIdentityHttpFixture({ role: "owner" })
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
})

function createIdentityHttpFixture(input: {
  readonly conflict?: boolean
  readonly role: "operator" | "owner"
}) {
  const sessionResolver: AdminSessionResolver = {
    async resolveSession(headers) {
      return headers.get("Cookie") === "admin=valid"
        ? {
            admin: {
              email: "owner@example.com",
              id: ownerId,
              name: "소유자",
              role: input.role,
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
        items: [user],
        page: query.page,
        pageSize: query.pageSize,
        totalItems: 1,
        totalPages: 1,
      }
    },
  }
  const mutation: AdminUserMutationUseCase = {
    async deleteUser() {
      return ok(undefined)
    },
    async updateUserStatus(command) {
      return input.conflict === true
        ? err({ kind: "identity-conflict" })
        : ok({ ...user, status: command.status })
    },
  }

  return createApp({
    routes: createAdminIdentityRoutes({
      sessionResolver,
      userMutationService: mutation,
      userReader: reader,
    }),
  })
}

function createLearnerIdentityHttpFixture() {
  return createApp({
    routes: createLearnerIdentityRoutes({
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
    }),
  })
}
