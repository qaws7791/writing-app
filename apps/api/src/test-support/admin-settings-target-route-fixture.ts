import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { adminSettingsDtoSchema } from "@workspace/contracts/operations/settings-data"
import { adminRoles } from "@workspace/identity/admin-actor"
import type { AdminSettingsUseCase } from "@workspace/core/admin"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/identity/sessions"
import { createAdminApp } from "@/http/admin-app"
import { createAdminSettingsRoutes } from "@/modules/admin-settings/admin-settings.routes"

type AdminSettingsTargetRouteFixtureJson =
  | null
  | boolean
  | number
  | string
  | readonly AdminSettingsTargetRouteFixtureJson[]
  | { readonly [key: string]: AdminSettingsTargetRouteFixtureJson }

export type AdminSettingsTargetRouteFixture = {
  readonly fetch: (request: Request) => Promise<Response> | Response
  readonly readEffectJournal: () => readonly AdminSettingsTargetRouteFixtureJson[]
}

const fixtureNow = new Date("2026-06-14T03:00:00.000Z")
const settings = adminSettingsDtoSchema.parse({
  legal: {
    privacy: "개인정보처리방침",
    terms: "이용약관",
  },
  notice: {
    announce: "공지 내용",
    banner: "새 강의가 추가되었어요!",
  },
})
export function createAdminSettingsTargetRouteFixture(
  scenario: string
): AdminSettingsTargetRouteFixture {
  const journal = createEffectJournal()
  const sessionResolver = createSessionResolver(scenario)
  const app = createAdminApp({
    capabilityRoutes: createAdminSettingsRoutes({
      now: () => fixtureNow,
      sessionResolver,
      settingsService: createSettingsService(journal),
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

function createSettingsService(
  journal: ReturnType<typeof createEffectJournal>
): AdminSettingsUseCase {
  return {
    async getSettings() {
      journal.record("settings.read", {})
      return settings
    },
    async updateLegalSettings(input) {
      journal.record("settings.legal.save", {
        actor: {
          id: input.actor.id,
          role: input.actor.role,
        },
        now: input.now.toISOString(),
        privacy: input.privacy,
        terms: input.terms,
      })

      return { kind: "ok", value: settings }
    },
    async updateNoticeSettings(input) {
      journal.record("settings.notice.save", {
        actor: {
          id: input.actor.id,
          role: input.actor.role,
        },
        announce: input.announce,
        banner: input.banner,
        now: input.now.toISOString(),
      })

      return { kind: "ok", value: settings }
    },
  }
}

function createSessionResolver(scenario: string): AdminSessionResolver {
  const session = {
    admin: {
      email: "admin@example.com",
      id: adminIdSchema.parse("admin-1"),
      name: "관리자",
      role: readScenarioRole(scenario),
    },
    [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
  } as const satisfies AdminAuthenticatedSession

  return {
    async resolveSession(headers) {
      return readAdminSessionToken(headers) === "admin-token" ? session : null
    },
  }
}

function readScenarioRole(scenario: string) {
  if (scenario === "owner") return adminRoles.owner
  if (scenario === "operator") return adminRoles.operator

  throw new Error(
    `지원하지 않는 target admin settings scenario입니다: ${scenario}`
  )
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

function createEffectJournal() {
  const entries: AdminSettingsTargetRouteFixtureJson[] = []
  let sequence = 0

  return {
    record(effect: string, input: AdminSettingsTargetRouteFixtureJson) {
      sequence += 1
      entries.push({ effect, input, sequence })
    },
    read() {
      return entries
    },
  }
}
