import { describe, expect, it, vi } from "vitest"

import { proxyAuthRequest, type AuthProxyFetch } from "."

describe("proxyAuthRequest", () => {
  it("encodes path segments and preserves query strings", async () => {
    const fetch = vi.fn<AuthProxyFetch>(async (request) => {
      expect(request.url).toBe(
        "http://localhost:4001/api/auth/sign-in/email%2Fpassword?next=%2Fcourses"
      )

      return new Response(null)
    })

    await proxyAuthRequest({
      apiBaseUrl: "http://localhost:4001",
      fetch,
      path: ["sign-in", "email/password"],
      request: new Request(
        "http://localhost:3001/api/auth/sign-in/email%2Fpassword?next=%2Fcourses"
      ),
    })

    expect(fetch).toHaveBeenCalledOnce()
  })

  it("sets forwarded headers and removes the incoming host header", async () => {
    const fetch = vi.fn<AuthProxyFetch>(async (request) => {
      expect(request.headers.get("host")).toBeNull()
      expect(request.headers.get("x-forwarded-host")).toBe("admin.example.com")
      expect(request.headers.get("x-forwarded-proto")).toBe("https")

      return new Response(null)
    })

    await proxyAuthRequest({
      apiBaseUrl: "http://localhost:4001",
      fetch,
      path: ["get-session"],
      request: new Request("https://admin.example.com/api/auth/get-session", {
        headers: {
          cookie: "writing-app-admin.session=s1",
          host: "admin.example.com",
        },
      }),
    })
  })

  it("does not forward a body for GET requests", async () => {
    const fetch = vi.fn<AuthProxyFetch>(async (request) => {
      expect(request.method).toBe("GET")
      expect(request.body).toBeNull()

      return new Response(null)
    })

    await proxyAuthRequest({
      apiBaseUrl: "http://localhost:4001",
      fetch,
      path: ["get-session"],
      request: new Request("http://localhost:3001/api/auth/get-session"),
    })
  })

  it("forwards POST bodies to the backend auth route", async () => {
    const fetch = vi.fn<AuthProxyFetch>(async (request) => {
      expect(request.method).toBe("POST")
      expect(await request.json()).toEqual({
        email: "admin@example.com",
        password: "password-1234",
      })

      return Response.json({ user: { id: "admin-1" } })
    })

    await proxyAuthRequest({
      apiBaseUrl: "http://localhost:4001/",
      fetch,
      path: ["sign-in", "email"],
      request: new Request(
        "http://localhost:3001/api/auth/sign-in/email?callbackURL=%2Fcourses",
        {
          body: JSON.stringify({
            email: "admin@example.com",
            password: "password-1234",
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      ),
    })
  })

  it("preserves backend Set-Cookie headers", async () => {
    const fetch = vi.fn<AuthProxyFetch>(
      async () =>
        new Response(null, {
          headers: {
            "Set-Cookie":
              "better-auth.session_token=session-1; Path=/; HttpOnly",
          },
          status: 200,
        })
    )

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

    expect(response.headers.get("Set-Cookie")).toBe(
      "better-auth.session_token=session-1; Path=/; HttpOnly"
    )
  })
})
