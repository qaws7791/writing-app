import { afterEach, describe, expect, it, vi } from "vitest"

import {
  getBrowserLearnerSessionToken,
  learnerSessionCookieName,
  readLearnerSessionTokenFromCookieHeader,
} from "@/shared/auth/session-token"

describe("learner session token", () => {
  it("learner_session_token 쿠키 값을 서버 요청 Cookie 헤더용 토큰으로 읽는다", () => {
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

  it("잘못 인코딩된 쿠키 값은 요청 전체를 실패시키지 않고 null로 처리한다", () => {
    expect(
      readLearnerSessionTokenFromCookieHeader(
        `${learnerSessionCookieName}=%E0%A4%A`
      )
    ).toBeNull()
  })

  it("브라우저 런타임에서는 httpOnly Better Auth 쿠키 값을 직접 읽지 않는다", () => {
    vi.stubGlobal("document", {
      cookie: `${learnerSessionCookieName}=session-token`,
    })

    expect(getBrowserLearnerSessionToken()).toBeNull()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })
})
