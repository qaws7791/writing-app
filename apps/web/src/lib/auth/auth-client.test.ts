import { afterEach, describe, expect, it, vi } from "vitest"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import {
  readLessonDraftText,
  writeLessonDraftText,
} from "@workspace/ui/lib/lesson-draft-storage"

import { createWebAuthClient } from "@/lib/auth/auth-client"
import { readBrowserApiBaseUrl, type BrowserApiBaseUrl } from "@/runtime-config"

describe("auth client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("Better Auth sign-out endpoint를 POST로 호출하고 안전한 이동 경로를 반환한다", async () => {
    const fetch = vi.fn(async () => Response.json({ success: true }))
    const authClient = createWebAuthClient({
      apiBaseUrl: readBrowserApiBaseUrl({}),
      fetchImplementation: fetch,
    })
    writeLessonDraftText("learner-test", "step-1", "로그아웃할 초안")

    await expect(
      authClient.requestLogout("/app/profile", "learner-test")
    ).resolves.toBe("/app/profile")

    expect(fetch).toHaveBeenCalledWith(
      `${localRuntimeDefaults.learnerApiBaseUrl}/api/auth/sign-out`,
      {
        credentials: "include",
        method: "POST",
      }
    )
    expect(readLessonDraftText("learner-test", "step-1")).toBe("")
  })

  it("로그아웃 후 이동 경로는 외부 URL을 허용하지 않는다", async () => {
    const authClient = createWebAuthClient({
      apiBaseUrl: readBrowserApiBaseUrl({}),
      fetchImplementation: vi.fn(async () => Response.json({ success: true })),
    })

    await expect(
      authClient.requestLogout("https://example.com", "learner-test")
    ).resolves.toBe("/app")
  })

  it("Google 로그인 요청은 Better Auth client factory에 API base URL을 주입한다", async () => {
    const social = vi.fn(async () => undefined)
    const betterAuthClientFactory = vi.fn(() => ({
      signIn: {
        social,
      },
    }))
    const authClient = createWebAuthClient({
      apiBaseUrl: readBrowserApiBaseUrl({}),
      betterAuthClientFactory,
    })

    await authClient.requestGoogleLogin("/app/courses")

    expect(betterAuthClientFactory).toHaveBeenCalledWith({
      baseURL: localRuntimeDefaults.learnerApiBaseUrl,
    })
    expect(social).toHaveBeenCalledWith({
      callbackURL: "http://localhost:3000/app/courses",
      provider: "google",
    })
  })

  it("테스트 로그인 요청은 테스트 인증 endpoint로 브라우저를 이동시킨다", () => {
    const assign = vi.fn()
    vi.stubGlobal("window", {
      location: {
        assign,
        origin: "http://localhost:3000",
      },
    })
    const authClient = createWebAuthClient({
      apiBaseUrl: "http://localhost:4000" as BrowserApiBaseUrl,
      fetchImplementation: vi.fn(async () => Response.json({ success: true })),
    })

    authClient.requestTestLogin("/app/courses")

    expect(assign).toHaveBeenCalledWith(
      "http://localhost:4000/api/auth/test/sign-in?callbackURL=http%3A%2F%2Flocalhost%3A3000%2Fapp%2Fcourses"
    )
  })
})
