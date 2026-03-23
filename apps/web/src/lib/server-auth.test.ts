import { describe, expect, test, vi } from "vitest"

import {
  fetchSessionSnapshot,
  getSessionAccessRedirectPath,
  resolveSessionApiBaseUrl,
  type SessionSnapshot,
} from "./server-auth"

function createSessionSnapshot(): SessionSnapshot {
  return {
    session: {
      createdAt: "2026-03-20T09:00:00.000Z",
      expiresAt: "2026-03-20T10:00:00.000Z",
      id: "session-1",
      token: "token-1",
      updatedAt: "2026-03-20T09:00:00.000Z",
      userId: "user-1",
    },
    user: {
      email: "writer@example.com",
      emailVerified: true,
      id: "user-1",
      name: "Writer",
    },
  }
}

describe("server auth", () => {
  test("resolves loopback api base url from request host", () => {
    expect(
      resolveSessionApiBaseUrl("http://127.0.0.1:3010", "localhost:3000")
    ).toBe("http://localhost:3010")
  })

  test("fetches current session with request cookie", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify(createSessionSnapshot()), { status: 200 })
    )

    const session = await fetchSessionSnapshot({
      apiBaseUrl: "http://127.0.0.1:3010",
      cookie: "session=abc",
      fetchImpl,
      requestHost: "localhost:3000",
    })

    expect(session).toEqual(createSessionSnapshot())
    expect(fetchImpl).toHaveBeenCalledWith("http://localhost:3010/session", {
      cache: "no-store",
      headers: {
        cookie: "session=abc",
      },
    })
  })

  test("returns null for unauthorized session response", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 401 }))

    await expect(
      fetchSessionSnapshot({
        apiBaseUrl: "http://127.0.0.1:3010",
        fetchImpl,
        requestHost: "127.0.0.1:3000",
      })
    ).resolves.toBeNull()
  })

  test("maps non-401 failures to a consistent error", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 500 }))

    await expect(
      fetchSessionSnapshot({
        apiBaseUrl: "http://127.0.0.1:3010",
        fetchImpl,
        requestHost: "127.0.0.1:3000",
      })
    ).rejects.toThrow("세션 상태를 확인하지 못했습니다.")
  })

  test("redirect policy keeps protected pages open in local mode", () => {
    expect(
      getSessionAccessRedirectPath({
        access: "protected",
        isLocalMode: true,
        session: null,
      })
    ).toBeNull()
  })

  test("redirect policy sends missing protected session to sign-in", () => {
    expect(
      getSessionAccessRedirectPath({
        access: "protected",
        isLocalMode: false,
        session: null,
      })
    ).toBe("/sign-in")
  })

  test("redirect policy sends public auth pages to home when session exists", () => {
    expect(
      getSessionAccessRedirectPath({
        access: "public",
        isLocalMode: false,
        session: createSessionSnapshot(),
      })
    ).toBe("/home")
  })

  test("redirect policy sends public auth pages to home in local mode", () => {
    expect(
      getSessionAccessRedirectPath({
        access: "public",
        isLocalMode: true,
        session: null,
      })
    ).toBe("/home")
  })
})
