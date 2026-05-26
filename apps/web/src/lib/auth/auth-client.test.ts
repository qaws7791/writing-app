import { describe, expect, it, vi } from "vitest"

import { requestEmailAuth, type AuthFetch } from "@/lib/auth/auth-client"

describe("requestEmailAuth", () => {
  it("posts login requests to the Better Auth email endpoint", async () => {
    const fetch = vi.fn<AuthFetch>(async () =>
      Response.json({ user: { id: "user-1" } })
    )

    const result = await requestEmailAuth({
      baseUrl: "http://localhost:4000",
      email: "learner@example.com",
      fetch,
      mode: "login",
      password: "password-1234",
    })

    expect(result).toEqual({ status: "ok" })
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/auth/sign-in/email",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      })
    )
  })

  it("posts signup requests with the learner name", async () => {
    const fetch = vi.fn<AuthFetch>(async () =>
      Response.json({ user: { id: "user-1" } })
    )

    await requestEmailAuth({
      baseUrl: "http://localhost:4000",
      email: "learner@example.com",
      fetch,
      mode: "signup",
      name: "학습자",
      password: "password-1234",
    })

    const body = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))

    expect(fetch.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/api/auth/sign-up/email"
    )
    expect(body).toEqual({
      email: "learner@example.com",
      name: "학습자",
      password: "password-1234",
    })
  })

  it("returns a readable error when authentication fails", async () => {
    const fetch = vi.fn<AuthFetch>(async () =>
      Response.json({ message: "Invalid password." }, { status: 401 })
    )

    await expect(
      requestEmailAuth({
        baseUrl: "http://localhost:4000",
        email: "learner@example.com",
        fetch,
        mode: "login",
        password: "wrong-password",
      })
    ).resolves.toEqual({
      status: "error",
      message: "Invalid password.",
    })
  })
})
