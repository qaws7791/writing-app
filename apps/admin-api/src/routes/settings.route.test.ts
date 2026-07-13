import { describe, expect, it } from "vitest"
import { adminIdSchema } from "@workspace/contracts/admin"

import { createApp, type AdminApiDependencies } from "@/app"
import { adminSessionExpiresAt } from "@/auth/admin-session"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminContentResetResultDto,
  AdminSettingsDto,
} from "@workspace/contracts/admin"
import type { AdminRole } from "@workspace/core/admin"
import { adminRoles } from "@workspace/core/admin"

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

const contentResetResult: AdminContentResetResultDto = {
  changed: {
    archived: 0,
    courses: 5,
    lessons: 44,
    steps: 136,
    units: 15,
  },
  revision: 1,
}

describe("어드민 API settings route", () => {
  it("관리자 세션이 없으면 운영 설정 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  })

  it("관리자 세션이 있으면 운영 설정을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings", {
      headers: {
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(settings)
  })

  it("공지와 배너 설정을 저장한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings/notice", {
      body: JSON.stringify({
        announce: "공지 내용",
        banner: "새 강의가 추가되었어요!",
      }),
      headers: {
        Cookie: "admin_session_token=admin-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3001",
      },
      method: "PUT",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(settings)
  })

  it("운영자는 공지와 배너 설정을 저장할 수 없다", async () => {
    const app = createApp(createDependencies({ role: adminRoles.operator }))

    const response = await app.request("/settings/notice", {
      body: JSON.stringify({
        announce: "공지 내용",
        banner: "새 강의가 추가되었어요!",
      }),
      headers: {
        Cookie: "admin_session_token=admin-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3001",
      },
      method: "PUT",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })

  it("약관과 개인정보처리방침 설정을 저장한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings/legal", {
      body: JSON.stringify({
        privacy: "개인정보처리방침",
        terms: "이용약관",
      }),
      headers: {
        Cookie: "admin_session_token=admin-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3001",
      },
      method: "PUT",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(settings)
  })

  it("운영자는 약관과 개인정보처리방침 설정을 저장할 수 없다", async () => {
    const app = createApp(createDependencies({ role: adminRoles.operator }))

    const response = await app.request("/settings/legal", {
      body: JSON.stringify({
        privacy: "개인정보처리방침",
        terms: "이용약관",
      }),
      headers: {
        Cookie: "admin_session_token=admin-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3001",
      },
      method: "PUT",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })

  it("콘텐츠 초기화 결과를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings/content-reset", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(contentResetResult)
  })

  it("운영자는 콘텐츠 초기화를 실행할 수 없다", async () => {
    const app = createApp(createDependencies({ role: adminRoles.operator }))

    const response = await app.request("/settings/content-reset", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
      method: "POST",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })

  it("허용하지 않는 운영 설정 요청은 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings/notice", {
      body: JSON.stringify({
        banner: 1,
      }),
      headers: {
        Cookie: "admin_session_token=admin-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3001",
      },
      method: "PUT",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
  })

  it("잘못된 JSON 운영 설정 요청은 malformed_json detail로 응답한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings/notice", {
      body: "{",
      headers: {
        Cookie: "admin_session_token=admin-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3001",
      },
      method: "PUT",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "HTTP_EXCEPTION",
      message: "Bad Request",
    })
  })
})

function createDependencies({
  role = adminRoles.owner,
}: {
  readonly role?: AdminRole
} = {}): AdminApiDependencies {
  return createTestAdminApiDependencies({
    adminServices: {
      contentReset: {
        async resetContent(input) {
          expect(input.now).toEqual(testAdminNow)
          expect(input.actor).toEqual({
            id: adminIdSchema.parse("admin-1"),
            role,
          })
          return { kind: "ok", value: contentResetResult }
        },
      },
      settings: {
        async getSettings() {
          return settings
        },
        async updateLegalSettings(input) {
          expect(input).toEqual({
            actor: { id: adminIdSchema.parse("admin-1"), role },
            now: testAdminNow,
            privacy: "개인정보처리방침",
            terms: "이용약관",
          })

          return { kind: "ok", value: settings }
        },
        async updateNoticeSettings(input) {
          expect(input).toEqual({
            actor: { id: adminIdSchema.parse("admin-1"), role },
            announce: "공지 내용",
            banner: "새 강의가 추가되었어요!",
            now: testAdminNow,
          })

          return { kind: "ok", value: settings }
        },
      },
    },
    sessionResolver: {
      async resolveSession(headers) {
        if (
          !headers.get("Cookie")?.includes("admin_session_token=admin-token")
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
    },
  })
}
