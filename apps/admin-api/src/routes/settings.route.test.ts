import { describe, expect, it } from "vitest"
import { readBearerToken } from "@workspace/core/auth"

import { createApp, type AdminApiDependencies } from "@/app"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminContentResetResultDto,
  AdminSettingsDto,
} from "@workspace/core/admin"

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
      error: {
        code: "unauthorized",
      },
    })
  })

  it("관리자 세션이 있으면 운영 설정을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings", {
      headers: {
        Authorization: "Bearer admin-token",
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
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "PUT",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(settings)
  })

  it("운영자는 공지와 배너 설정을 저장할 수 없다", async () => {
    const app = createApp(createDependencies({ role: "operator" }))

    const response = await app.request("/settings/notice", {
      body: JSON.stringify({
        announce: "공지 내용",
        banner: "새 강의가 추가되었어요!",
      }),
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "PUT",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "forbidden",
      },
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
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "PUT",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(settings)
  })

  it("운영자는 약관과 개인정보처리방침 설정을 저장할 수 없다", async () => {
    const app = createApp(createDependencies({ role: "operator" }))

    const response = await app.request("/settings/legal", {
      body: JSON.stringify({
        privacy: "개인정보처리방침",
        terms: "이용약관",
      }),
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "PUT",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "forbidden",
      },
    })
  })

  it("콘텐츠 초기화 결과를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings/content-reset", {
      headers: {
        Authorization: "Bearer admin-token",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(contentResetResult)
  })

  it("운영자는 콘텐츠 초기화를 실행할 수 없다", async () => {
    const app = createApp(createDependencies({ role: "operator" }))

    const response = await app.request("/settings/content-reset", {
      headers: {
        Authorization: "Bearer admin-token",
      },
      method: "POST",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "forbidden",
      },
    })
  })

  it("허용하지 않는 운영 설정 요청은 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/settings/notice", {
      body: JSON.stringify({
        banner: 1,
      }),
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "PUT",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
    })
  })
})

function createDependencies({
  role = "owner",
}: {
  readonly role?: "operator" | "owner"
} = {}): AdminApiDependencies {
  return createTestAdminApiDependencies({
    dashboardService: {
      async getSettings() {
        return settings
      },
      async resetContent(input) {
        expect(input.now).toEqual(testAdminNow)
        return contentResetResult
      },
      async updateLegalSettings(input) {
        expect(input).toEqual({
          now: testAdminNow,
          privacy: "개인정보처리방침",
          terms: "이용약관",
        })

        return settings
      },
      async updateNoticeSettings(input) {
        expect(input).toEqual({
          announce: "공지 내용",
          banner: "새 강의가 추가되었어요!",
          now: testAdminNow,
        })

        return settings
      },
    },
    sessionResolver: {
      async resolveSession(headers) {
        const token = readBearerToken(headers.get("Authorization"))

        if (token !== "admin-token") {
          return null
        }

        return {
          admin: {
            email: "admin@example.com",
            id: "admin-1",
            name: "관리자",
            role,
          },
        }
      },
    },
  })
}
