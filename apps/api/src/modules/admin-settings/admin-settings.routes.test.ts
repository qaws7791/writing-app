import { describe, expect, it, vi } from "vitest"
import { adminIdSchema } from "@workspace/contracts/admin"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { adminRoles, type AdminRole } from "@workspace/core/admin"
import type { AdminContentResetUseCase } from "@workspace/core/content"
import type { AdminSettingsDto } from "@workspace/contracts/admin/settings-data"
import type { AdminSettingsUseCase } from "@workspace/core/admin"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "@/adapters/auth/admin-session"
import { createAdminApp } from "@/http/admin-app"
import {
  createAdminSettingsRoutes,
  type AdminSettingsRouteDependencies,
} from "@/modules/admin-settings/admin-settings.routes"

const settings: AdminSettingsDto = {
  legal: {
    privacy: "개인정보처리방침",
    terms: "이용약관",
  },
  notice: {
    announce: "공지 내용",
    banner: "새 강의가 추가되었어요!",
  },
}
const contentResetResult = {
  changed: {
    archived: 0,
    courses: 5,
    lessons: 44,
    steps: 136,
    units: 15,
  },
  revision: 1,
} as const

describe("통합 runtime 관리자 settings route", () => {
  it("세션 없는 조회는 401이고 cookie 세션 조회는 기존 snapshot을 반환한다", async () => {
    const app = createSettingsApp(createDependencies())

    const unauthenticated = await app.request("/settings")
    const authenticated = await app.request("/settings", {
      headers: { Cookie: `${adminSessionCookieName}=admin-token` },
    })

    expect(unauthenticated.status).toBe(401)
    await expect(unauthenticated.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
    expect(authenticated.status).toBe(200)
    await expect(authenticated.json()).resolves.toEqual(settings)
  })

  it("owner notice 저장은 검증된 command를 전달하고 snapshot을 반환한다", async () => {
    const dependencies = createDependencies()
    const updateNoticeSettings = vi.fn(
      dependencies.settingsService.updateNoticeSettings
    )
    const app = createSettingsApp({
      ...dependencies,
      settingsService: {
        ...dependencies.settingsService,
        updateNoticeSettings,
      },
    })

    const response = await app.request("/settings/notice", {
      body: JSON.stringify(settings.notice),
      headers: mutationHeaders(),
      method: "PUT",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(settings)
    expect(updateNoticeSettings).toHaveBeenCalledWith({
      actor: { id: adminIdSchema.parse("admin-1"), role: adminRoles.owner },
      announce: settings.notice.announce,
      banner: settings.notice.banner,
      now: new Date("2026-06-14T03:00:00.000Z"),
    })
  })

  it("operator는 모든 owner mutation에서 service 호출 전 403을 받는다", async () => {
    const dependencies = createDependencies({ role: adminRoles.operator })
    const updateNoticeSettings = vi.fn(
      dependencies.settingsService.updateNoticeSettings
    )
    const resetContent = vi.fn(dependencies.contentResetService.resetContent)
    const app = createSettingsApp({
      ...dependencies,
      contentResetService: {
        resetContent,
      },
      settingsService: {
        ...dependencies.settingsService,
        updateNoticeSettings,
      },
    })

    const [notice, reset] = await Promise.all([
      app.request("/settings/notice", {
        body: JSON.stringify(settings.notice),
        headers: mutationHeaders(),
        method: "PUT",
      }),
      app.request("/settings/content-reset", {
        headers: ownerMutationHeaders(),
        method: "POST",
      }),
    ])

    for (const response of [notice, reset]) {
      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({
        code: "FORBIDDEN",
        message: "Forbidden",
      })
    }
    expect(updateNoticeSettings).not.toHaveBeenCalled()
    expect(resetContent).not.toHaveBeenCalled()
  })

  it("invalid body는 settings service 전에 400으로 거절한다", async () => {
    const dependencies = createDependencies()
    const updateLegalSettings = vi.fn(
      dependencies.settingsService.updateLegalSettings
    )
    const app = createSettingsApp({
      ...dependencies,
      settingsService: {
        ...dependencies.settingsService,
        updateLegalSettings,
      },
    })

    const response = await app.request("/settings/legal", {
      body: JSON.stringify({ privacy: 1 }),
      headers: mutationHeaders(),
      method: "PUT",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
    expect(updateLegalSettings).not.toHaveBeenCalled()
  })

  it("owner 법적 문서 저장은 별도 target operation으로 service에 전달한다", async () => {
    const dependencies = createDependencies()
    const updateLegalSettings = vi.fn(
      dependencies.settingsService.updateLegalSettings
    )
    const app = createSettingsApp({
      ...dependencies,
      settingsService: {
        ...dependencies.settingsService,
        updateLegalSettings,
      },
    })

    const response = await app.request("/settings/legal", {
      body: JSON.stringify(settings.legal),
      headers: mutationHeaders(),
      method: "PUT",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(settings)
    expect(updateLegalSettings).toHaveBeenCalledWith({
      actor: { id: adminIdSchema.parse("admin-1"), role: adminRoles.owner },
      now: new Date("2026-06-14T03:00:00.000Z"),
      privacy: settings.legal.privacy,
      terms: settings.legal.terms,
    })
  })

  it("content reset의 성공값도 공개 schema를 통과한 뒤 반환한다", async () => {
    const app = createSettingsApp(createDependencies())

    const response = await app.request("/settings/content-reset", {
      headers: ownerMutationHeaders(),
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(contentResetResult)
  })

  it("Settings OpenAPI가 네 target operation과 owner 응답을 등록한다", async () => {
    const app = createSettingsApp(createDependencies())
    const response = await app.request("/openapi")
    const document = await response.json()

    expect(response.status).toBe(200)
    expect(document).toMatchObject({
      components: {
        securitySchemes: {
          adminSessionCookie: {
            in: "cookie",
            name: adminSessionCookieName,
            type: "apiKey",
          },
        },
      },
      paths: {
        "/api/admin/settings": { get: { operationId: "getAdminSettings" } },
        "/api/admin/settings/content-reset": {
          post: { operationId: "resetAdminContent" },
        },
        "/api/admin/settings/legal": {
          put: { operationId: "updateAdminLegalSettings" },
        },
        "/api/admin/settings/notice": {
          put: { operationId: "updateAdminNoticeSettings" },
        },
      },
    })
  })
})

function createSettingsApp(dependencies: AdminSettingsRouteDependencies) {
  return createAdminApp({
    capabilityRoutes: createAdminSettingsRoutes(dependencies),
    sessionResolver: dependencies.sessionResolver,
  })
}

function createDependencies({
  role = adminRoles.owner,
}: {
  readonly role?: AdminRole
} = {}): AdminSettingsRouteDependencies {
  const sessionResolver = createSessionResolver(role)
  const settingsService: AdminSettingsUseCase = {
    async getSettings() {
      return settings
    },
    async updateLegalSettings() {
      return { kind: "ok", value: settings }
    },
    async updateNoticeSettings() {
      return { kind: "ok", value: settings }
    },
  }
  const contentResetService: AdminContentResetUseCase = {
    async resetContent() {
      return { kind: "ok", value: contentResetResult }
    },
  }

  return {
    contentResetService,
    now: () => new Date("2026-06-14T03:00:00.000Z"),
    sessionResolver,
    settingsService,
  }
}

function createSessionResolver(role: AdminRole): AdminSessionResolver {
  return {
    async resolveSession(headers) {
      if (
        !headers
          .get("Cookie")
          ?.includes(`${adminSessionCookieName}=admin-token`)
      ) {
        return null
      }

      return {
        admin: {
          email: "admin@example.com",
          id: adminIdSchema.parse("admin-1"),
          name: "관리자",
          role,
        },
        [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
      }
    },
  }
}

function mutationHeaders() {
  return {
    Cookie: `${adminSessionCookieName}=admin-token`,
    "Content-Type": "application/json",
    Origin: localRuntimeDefaults.adminWebOrigin,
  }
}

function ownerMutationHeaders() {
  return {
    Cookie: `${adminSessionCookieName}=admin-token`,
    Origin: localRuntimeDefaults.adminWebOrigin,
  }
}
