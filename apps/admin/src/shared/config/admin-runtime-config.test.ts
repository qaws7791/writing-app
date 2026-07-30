import { describe, expect, it } from "vitest"

import { readLearnerWebOrigin } from "@/shared/config/admin-runtime-config"

describe("readLearnerWebOrigin", () => {
  it("production에서 학습자 공개 origin이 비어 있으면 로컬 fallback을 거부한다", () => {
    expect(() => readLearnerWebOrigin({ NODE_ENV: "production" })).toThrow(
      "production learner web origin is required"
    )
  })

  it("production에서 HTTP 학습자 공개 origin을 거부한다", () => {
    expect(() =>
      readLearnerWebOrigin({
        NEXT_PUBLIC_LEARNER_WEB_ORIGIN: "http://writing.example.test",
        NODE_ENV: "production",
      })
    ).toThrow("production learner web origin must use HTTPS")
  })

  it("설정된 학습자 공개 주소는 경로를 버리고 origin만 남긴다", () => {
    expect(
      readLearnerWebOrigin({
        NEXT_PUBLIC_LEARNER_WEB_ORIGIN: "https://writing.example.test/learn",
        NODE_ENV: "production",
      })
    ).toBe("https://writing.example.test")
  })
})
