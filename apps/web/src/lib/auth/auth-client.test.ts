import { describe, expect, it, vi } from "vitest"
import { localRuntimeDefaults } from "@workspace/env"

import { createWebAuthClient } from "@/lib/auth/auth-client"
import { readBrowserApiBaseUrl } from "@/runtime-config"

describe("auth client", () => {
  it("Better Auth sign-out endpoint를 POST로 호출하고 안전한 이동 경로를 반환한다", async () => {
    const fetch = vi.fn(async () => Response.json({ success: true }))
    const authClient = createWebAuthClient({
      apiBaseUrl: readBrowserApiBaseUrl({}),
      fetchImplementation: fetch,
    })

    await expect(authClient.requestLogout("/app/profile")).resolves.toBe(
      "/app/profile"
    )

    expect(fetch).toHaveBeenCalledWith(
      `${localRuntimeDefaults.learnerApiBaseUrl}/api/auth/sign-out`,
      {
        credentials: "include",
        method: "POST",
      }
    )
  })

  it("로그아웃 후 이동 경로는 외부 URL을 허용하지 않는다", async () => {
    const authClient = createWebAuthClient({
      apiBaseUrl: readBrowserApiBaseUrl({}),
      fetchImplementation: vi.fn(async () => Response.json({ success: true })),
    })

    await expect(authClient.requestLogout("https://example.com")).resolves.toBe(
      "/app"
    )
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
})
