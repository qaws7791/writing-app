import { describe, expect, it } from "vitest"

import { readBearerToken, resolveBearerSession } from "@/auth/bearer-session"

describe("bearer session helpers", () => {
  it("Bearer authorization header에서 토큰을 읽는다", () => {
    expect(readBearerToken("Bearer session-token")).toBe("session-token")
    expect(readBearerToken("Basic session-token")).toBeNull()
    expect(readBearerToken(null)).toBeNull()
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
