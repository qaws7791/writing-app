import { describe, expect, it } from "vitest"

import {
  parseBearerToken,
  readBearerToken,
  resolveBearerSession,
} from "@/auth/bearer-session"

describe("bearer session helpers", () => {
  it("Bearer authorization header에서 토큰을 읽는다", () => {
    expect(readBearerToken("Bearer session-token")).toBe("session-token")
    expect(readBearerToken("bearer session-token")).toBe("session-token")
    expect(readBearerToken("Bearer    session-token")).toBe("session-token")
    expect(readBearerToken("Basic session-token")).toBeNull()
    expect(readBearerToken(null)).toBeNull()
  })

  it("잘못된 Bearer authorization header를 거절한다", () => {
    expect(readBearerToken("Bearer")).toBeNull()
    expect(readBearerToken("Bearer ")).toBeNull()
    expect(readBearerToken("Bearer session-token extra")).toBeNull()
    expect(readBearerToken("Bearer session token")).toBeNull()
    expect(readBearerToken(" Bearer session-token")).toBeNull()
    expect(readBearerToken("Bearer session-token ")).toBeNull()
  })

  it("Bearer authorization header 파싱 실패 이유를 구분한다", () => {
    expect(parseBearerToken(null)).toEqual({
      kind: "err",
      reason: "missing",
    })
    expect(parseBearerToken("Basic session-token")).toEqual({
      kind: "err",
      reason: "invalid-scheme",
    })
    expect(parseBearerToken("Bearer session-token extra")).toEqual({
      kind: "err",
      reason: "invalid-format",
    })
    expect(parseBearerToken("Bearer session-token")).toEqual({
      kind: "ok",
      token: "session-token",
    })
  })

  it("토큰이 없거나 세션이 없으면 unauthorized 결과를 반환한다", async () => {
    const sessionResolver = {
      async resolveSession() {
        return null
      },
    }

    await expect(
      resolveBearerSession({
        authorizationHeader: null,
        sessionResolver,
      })
    ).resolves.toEqual({
      code: "unauthorized",
      kind: "err",
      status: 401,
    })

    await expect(
      resolveBearerSession({
        authorizationHeader: "Bearer missing-token",
        sessionResolver,
      })
    ).resolves.toEqual({
      code: "unauthorized",
      kind: "err",
      status: 401,
    })
  })

  it("토큰과 세션이 유효하면 세션을 반환한다", async () => {
    const session = {
      userId: "user-1",
    }
    const sessionResolver = {
      async resolveSession(token: string) {
        return token === "session-token" ? session : null
      },
    }

    await expect(
      resolveBearerSession({
        authorizationHeader: "Bearer session-token",
        sessionResolver,
      })
    ).resolves.toEqual({
      kind: "ok",
      session,
    })
  })
})
