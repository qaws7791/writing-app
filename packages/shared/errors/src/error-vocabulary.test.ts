import { describe, expect, it } from "vitest"

import type { InfrastructureError } from "#errors/infrastructure-error"
import type { TransportError } from "#errors/transport-error"

const publicErrors = [
  {
    dependency: "database",
    kind: "dependency-unavailable",
    retryable: true,
  } satisfies InfrastructureError,
  {
    kind: "network-failed",
    method: "GET",
    reason: "failed",
    url: "https://example.test/courses",
  } satisfies TransportError,
]

describe("공통 오류 vocabulary", () => {
  it("공개 가능한 값에 내부 원인과 민감정보 필드를 포함하지 않는다", () => {
    for (const error of publicErrors) {
      expect(Object.keys(error)).not.toEqual(
        expect.arrayContaining([
          "cause",
          "credential",
          "email",
          "password",
          "sql",
          "stack",
          "token",
        ])
      )
    }
  })
})
