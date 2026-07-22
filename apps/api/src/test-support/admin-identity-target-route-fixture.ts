import {
  adminUserDetailDtoSchema,
  adminUserListItemDtoSchema,
  adminIdSchema,
  userIdSchema,
} from "@workspace/contracts/identity/data"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { adminRoles } from "@workspace/identity/admin-actor"
import type {
  AdminUserMutationUseCase,
  AdminUserReader,
} from "@workspace/identity/queries"
import { err, ok } from "@workspace/kernel/result"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/identity/sessions"
import { createAdminIdentityRoutes } from "@workspace/identity/http"
import { createAdminApp } from "@/http/admin-app"
import type {
  AdminTargetRouteFixture,
  AdminTargetRouteFixtureJson,
} from "@/test-support/admin-target-route-fixture"

const identityNow = new Date("2026-07-18T00:00:00.000Z")
const testUserId = userIdSchema.parse("user-1")
const identityListItem = adminUserListItemDtoSchema.parse({
  email: "learner@example.com",
  id: testUserId,
  joined: "2026-06-14",
  lastActive: "2026-07-17",
  lessonsDone: 3,
  name: "학습자",
  status: "active",
  streak: 2,
})
const identityDetail = adminUserDetailDtoSchema.parse({
  ...identityListItem,
  progressPercent: 60,
  totalLessons: 5,
})

export function createAdminIdentityTargetRouteFixture(
  scenario: string
): AdminTargetRouteFixture {
  const sessionResolver = createAdminIdentitySessionResolver(scenario)
  const journal = createEffectJournal()
  const app = createAdminApp({
    adminOrigin: localRuntimeDefaults.adminWebOrigin,
    capabilityRoutes: createAdminIdentityRoutes({
      sessionResolver,
      userMutationService: createIdentityMutationService(journal),
      userReader: createIdentityReader(journal),
    }),
    sessionResolver,
  })

  return {
    fetch(request) {
      return app.fetch(request)
    },
    readEffectJournal() {
      return journal.read()
    },
  }
}

function createIdentityReader(journal: EffectJournal): AdminUserReader {
  return {
    async readUser({ userId }) {
      journal.record("identity.read-user", { userId })

      return userId === "missing" ? null : identityDetail
    },
    async readUsers(input) {
      journal.record("identity.read-users", input)

      return {
        items: [identityListItem],
        page: input.page,
        pageSize: input.pageSize,
        totalItems: 1,
        totalPages: 1,
      }
    },
  }
}

function createIdentityMutationService(
  journal: EffectJournal
): AdminUserMutationUseCase {
  return {
    async deleteUser({ actor, userId }) {
      journal.record("identity.delete-user", {
        actor: { id: actor.id, role: actor.role },
        now: identityNow.toISOString(),
        userId,
      })

      return userId === "missing"
        ? err({ kind: "identity-not-found" })
        : ok(undefined)
    },
    async updateUserStatus({ actor, status, userId }) {
      journal.record("identity.update-user-status", {
        actor: { id: actor.id, role: actor.role },
        now: identityNow.toISOString(),
        status,
        userId,
      })

      if (userId === "missing") return err({ kind: "identity-not-found" })

      return ok(adminUserDetailDtoSchema.parse({ ...identityDetail, status }))
    },
  }
}

function createAdminIdentitySessionResolver(
  scenario: string
): AdminSessionResolver {
  const session = {
    admin: {
      email: "admin@example.com",
      id: adminIdSchema.parse("admin-1"),
      name: "관리자",
      role: readAdminIdentityRole(scenario),
    },
    [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
  } as const satisfies AdminAuthenticatedSession

  return {
    async resolveSession(headers) {
      return readAdminSessionToken(headers) === "admin-token" ? session : null
    },
  }
}

function readAdminIdentityRole(scenario: string) {
  switch (scenario) {
    case "default":
      return adminRoles.owner
    case "operator":
      return adminRoles.operator
    default:
      throw new Error(
        `지원하지 않는 target admin identity scenario입니다: ${scenario}`
      )
  }
}

function readAdminSessionToken(headers: Headers): string | null {
  const cookies = headers.get("Cookie")
  if (cookies === null) return null

  const token = cookies
    .split(";")
    .map((cookie) => cookie.trim().split("=", 2))
    .find(([name]) => name === adminSessionCookieName)?.[1]

  return token === undefined ? null : decodeURIComponent(token)
}

type EffectJournal = {
  readonly read: () => readonly AdminTargetRouteFixtureJson[]
  readonly record: (effect: string, input: AdminTargetRouteFixtureJson) => void
}

function createEffectJournal(): EffectJournal {
  const entries: AdminTargetRouteFixtureJson[] = []
  let sequence = 0

  return {
    read() {
      return entries
    },
    record(effect, input) {
      sequence += 1
      entries.push({ effect, input, sequence })
    },
  }
}
