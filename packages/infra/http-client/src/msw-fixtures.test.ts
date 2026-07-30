import { describe, expect, it } from "vitest"

import { createApiErrorFixture } from "#http-client/msw-fixtures"

describe("canonical API 오류 fixture", () => {
  it("status별 기본 code와 requestId를 만든다", () => {
    expect(createApiErrorFixture(429)).toEqual({
      code: "TEST_HTTP_429",
      message: "HTTP 429 테스트 오류입니다.",
      requestId: "fixture-request-429",
    })
  })

  it("override한 violations를 canonical 오류에 담는다", () => {
    const fixture = createApiErrorFixture(409, {
      code: "REVISION_CONFLICT",
      violations: [
        {
          code: "stale_revision",
          message: "이미 수정된 문서입니다.",
          path: "body.revision",
        },
      ],
    })

    expect(fixture).toEqual({
      code: "REVISION_CONFLICT",
      message: "HTTP 409 테스트 오류입니다.",
      requestId: "fixture-request-409",
      violations: [
        {
          code: "stale_revision",
          message: "이미 수정된 문서입니다.",
          path: "body.revision",
        },
      ],
    })
  })

  it("canonical code 형식을 벗어난 override는 fixture 생성 시점에 거절한다", () => {
    expect(() =>
      createApiErrorFixture(500, { code: "revision_conflict" })
    ).toThrow()
  })
})
