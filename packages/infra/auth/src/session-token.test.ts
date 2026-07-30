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

  // 관리자 token은 cookie store에서 직접 읽어 percent-encoding을 거치지 않는다.
  // 학습자 경로와 달리 decode하지 않는 비대칭을 고정해, cookie header 파싱 경로가
  // 추가되면 이 계약이 먼저 깨지게 한다.
  it("관리자 token은 percent-encoding을 decode하지 않는다", () => {
    expect(normalizeAdminSessionToken("session%20token")).toBe(
      "session%20token"
    )
  })
})
