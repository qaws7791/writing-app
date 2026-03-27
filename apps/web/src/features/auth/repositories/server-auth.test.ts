import { describe, expect, test, vi, beforeEach } from "vitest"

import {
  fetchSessionSnapshot,
  getSessionAccessRedirectPath,
} from "./server-auth"
import { SessionRepository } from "./session-repository"
import type { SessionSnapshot } from "@/domain/auth"

vi.mock("@/foundation/config/env", () => ({
  env: {
    NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:3010",
    NEXT_PUBLIC_CLIENT_MODE: "api",
  },
}))

// 헤더 모킹
vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: (key: string) => {
        if (key === "cookie") return "better-auth.session_token=test-token"
        if (key === "host") return "localhost:3000"
        return null
      },
    })
  ),
}))

// SessionRepository 모킹
vi.mock("./session-repository")

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("fetches current session using repository", async () => {
    const mockSession = createSessionSnapshot()
    const mockGetSession = vi.fn(async () => mockSession)

    vi.mocked(SessionRepository).mockImplementation(
      function MockSessionRepository() {
        return {
          getSession: mockGetSession,
        } as any
      }
    )

    const session = await fetchSessionSnapshot()

    expect(session).toEqual(mockSession)
    expect(SessionRepository).toHaveBeenCalledWith({
      cookie: "better-auth.session_token=test-token",
      requestHost: "localhost:3000",
    })
    expect(mockGetSession).toHaveBeenCalled()
  })

  test("returns null for unauthorized session", async () => {
    const mockGetSession = vi.fn(async () => null)

    vi.mocked(SessionRepository).mockImplementation(
      function MockSessionRepository() {
        return {
          getSession: mockGetSession,
        } as any
      }
    )

    const session = await fetchSessionSnapshot()

    expect(session).toBeNull()
  })

  test("throws on session repository error", async () => {
    const mockError = new Error("세션 상태를 확인하지 못했습니다.")
    const mockGetSession = vi.fn(async () => {
      throw mockError
    })

    vi.mocked(SessionRepository).mockImplementation(
      function MockSessionRepository() {
        return {
          getSession: mockGetSession,
        } as any
      }
    )

    await expect(fetchSessionSnapshot()).rejects.toThrow(
      "세션 상태를 확인하지 못했습니다."
    )
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
