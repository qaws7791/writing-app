import { afterEach, describe, expect, it, vi } from "vitest"
import { localRuntimeDefaults } from "@workspace/env"

import { requestLogout } from "@/lib/auth/auth-client"

describe("auth client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env["NEXT_PUBLIC_API_BASE_URL"]
  })

  it("Better Auth sign-out endpoint를 POST로 호출하고 안전한 이동 경로를 반환한다", async () => {
    const fetch = vi.fn(async () => Response.json({ success: true }))

    vi.stubGlobal("fetch", fetch)
    process.env["NEXT_PUBLIC_API_BASE_URL"] =
      localRuntimeDefaults.learnerApiBaseUrl

    await expect(requestLogout("/app/profile")).resolves.toBe("/app/profile")

    expect(fetch).toHaveBeenCalledWith(
      `${localRuntimeDefaults.learnerApiBaseUrl}/api/auth/sign-out`,
      {
        credentials: "include",
        method: "POST",
      }
    )
  })

  it("로그아웃 후 이동 경로는 외부 URL을 허용하지 않는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ success: true }))
    )

    await expect(requestLogout("https://example.com")).resolves.toBe("/app")
  })
})
