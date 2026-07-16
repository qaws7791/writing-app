import { describe, expect, it } from "vitest"

import { createLearnerCursorCodec } from "#core/modules/learning/application/learner-cursor"

const secret = "test-cursor-signing-secret-with-32-bytes"

describe("학습자 cursor codec", () => {
  it("동일한 객체를 key 순서와 무관하게 같은 fingerprint로 만든다", () => {
    const codec = createLearnerCursorCodec(secret)

    expect(codec.createFingerprint({ a: 1, b: 2 })).toBe(
      codec.createFingerprint({ b: 2, a: 1 })
    )
  })

  it("endpoint·검색 조건·학습자 범위가 모두 일치할 때만 해석한다", () => {
    const codec = createLearnerCursorCodec(secret)
    const fingerprint = codec.createFingerprint({ status: "in_progress" })
    const learnerScope = codec.createLearnerScope("learner-1")
    const cursor = codec.encode({
      endpoint: "progress",
      fingerprint,
      learnerScope,
      position: { courseId: "course-1", primary: 1_752_000_000_000 },
    })

    expect(
      codec.decode(cursor, { endpoint: "progress", fingerprint, learnerScope })
    ).toEqual({ courseId: "course-1", primary: 1_752_000_000_000 })
    expect(
      codec.decode(cursor, {
        endpoint: "courses",
        fingerprint,
        learnerScope,
      })
    ).toBeNull()
    expect(
      codec.decode(cursor, {
        endpoint: "progress",
        fingerprint,
        learnerScope: codec.createLearnerScope("learner-2"),
      })
    ).toBeNull()
  })

  it("payload 또는 서명이 변조되면 거부한다", () => {
    const codec = createLearnerCursorCodec(secret)
    const fingerprint = codec.createFingerprint({ sort: "recommended" })
    const cursor = codec.encode({
      endpoint: "courses",
      fingerprint,
      position: { courseId: "course-1", primary: 1 },
    })
    const [payload, signature] = cursor.split(".")

    expect(
      codec.decode(`${payload}x.${signature}`, {
        endpoint: "courses",
        fingerprint,
      })
    ).toBeNull()
    expect(
      codec.decode(`${payload}.${signature}x`, {
        endpoint: "courses",
        fingerprint,
      })
    ).toBeNull()
  })

  it("32 byte보다 짧은 signing secret을 거부한다", () => {
    expect(() => createLearnerCursorCodec("short-secret")).toThrow(
      "at least 32 bytes"
    )
  })
})
