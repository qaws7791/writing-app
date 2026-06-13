import { describe, expect, it } from "vitest"

import {
  learnerSessionCookieName,
  readLearnerSessionTokenFromCookieHeader,
} from "@/lib/auth/session-token"

describe("learner session token", () => {
  it("kwep_session 쿠키 값을 Bearer token으로 사용한다", () => {
    expect(
      readLearnerSessionTokenFromCookieHeader(
        `theme=dark; ${learnerSessionCookieName}=user-1; other=value`
      )
    ).toBe("user-1")
  })

  it("쿠키가 없거나 빈 값이면 null을 반환한다", () => {
    expect(readLearnerSessionTokenFromCookieHeader("theme=dark")).toBeNull()
    expect(
      readLearnerSessionTokenFromCookieHeader(`${learnerSessionCookieName}=`)
    ).toBeNull()
    expect(readLearnerSessionTokenFromCookieHeader(null)).toBeNull()
  })
})
