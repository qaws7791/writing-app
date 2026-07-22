import { describe, expect, it } from "vitest"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import {
  normalizeAdminSessionToken,
  normalizeLearnerSessionToken,
  readLearnerSessionTokenFromCookieHeader,
} from "#auth/session-token"

describe("인증 session token", () => {
  it("학습자 cookie header에서 URL-decoded token을 읽는다", () => {
    expect(
      readLearnerSessionTokenFromCookieHeader(
        `theme=dark; ${learnerSessionCookieName}=session%20token; other=value`
      )
    ).toBe("session token")
  })

  it("학습자 token의 누락, 빈 값과 잘못된 encoding을 거절한다", () => {
    expect(readLearnerSessionTokenFromCookieHeader(null)).toBeNull()
    expect(readLearnerSessionTokenFromCookieHeader("theme=dark")).toBeNull()
    expect(
      readLearnerSessionTokenFromCookieHeader(
        `${learnerSessionCookieName}=%E0%A4%A`
      )
    ).toBeNull()
    expect(normalizeLearnerSessionToken("  ")).toBeNull()
  })

  it("관리자 token은 공백을 정규화하고 빈 값을 거절한다", () => {
    expect(normalizeAdminSessionToken(" admin-token ")).toBe("admin-token")
    expect(normalizeAdminSessionToken(" ")).toBeNull()
    expect(normalizeAdminSessionToken(undefined)).toBeNull()
  })
})
