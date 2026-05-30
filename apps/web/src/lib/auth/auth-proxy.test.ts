import { describe, expect, it, vi } from "vitest"

import { proxyAuthRequest, type AuthProxyFetch } from "@/lib/auth/auth-proxy"

describe("proxyAuthRequest", () => {
  it("forwards auth requests to the backend and preserves Set-Cookie", async () => {
    const fetch = vi.fn<AuthProxyFetch>(async (request) => {
      expect(request.url).toBe(
        "http://localhost:4000/api/auth/sign-in/social?next=%2Fapp"
      )
      expect(request.method).toBe("POST")
      expect(request.headers.get("x-forwarded-host")).toBe("localhost:3001")
      expect(request.headers.get("x-forwarded-proto")).toBe("http")
      expect(await request.json()).toEqual({
        callbackURL: "http://localhost:3001/app",
        provider: "google",
      })

      return new Response(null, {
        headers: {
          "Set-Cookie": "better-auth.session_token=session-1; Path=/; HttpOnly",
        },
        status: 200,
      })
    })

    const response = await proxyAuthRequest({
      apiBaseUrl: "http://localhost:4000",
      fetch,
      path: ["sign-in", "social"],
      request: new Request(
        "http://localhost:3001/api/auth/sign-in/social?next=%2Fapp",
        {
          body: JSON.stringify({
            callbackURL: "http://localhost:3001/app",
            provider: "google",
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      ),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("Set-Cookie")).toBe(
      "better-auth.session_token=session-1; Path=/; HttpOnly"
    )
  })
})
