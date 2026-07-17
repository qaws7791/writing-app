import { describe, expect, it } from "vitest"

import {
  createLearnerCursorCodec,
  readLearnerCourseCursorPrimary,
  resolveLearnerCourseCursorCondition,
  resolveLearnerProgressCursorCondition,
} from "#core/modules/learning/application/learner-cursor"

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

describe("학습자 keyset cursor condition", () => {
  it.each([
    ["recommended", 3, "ascending"],
    ["title-asc", "가나다", "ascending"],
    ["title-desc", "가나다", "descending"],
    ["lesson-count-asc", 7, "ascending"],
    ["lesson-count-desc", 7, "descending"],
  ] as const)(
    "%s course 정렬의 primary type과 방향을 결정한다",
    (sort, primary, primaryOrder) => {
      expect(
        resolveLearnerCourseCursorCondition(sort, {
          courseId: "course-2",
          primary,
        })
      ).toEqual({
        courseId: "course-2",
        kind: "after",
        primary,
        primaryOrder,
      })
    }
  )

  it.each([
    ["recommended", "3"],
    ["title-asc", 3],
    ["title-desc", null],
    ["lesson-count-asc", "7"],
    ["lesson-count-desc", null],
  ] as const)("%s의 잘못되거나 null인 primary를 거부한다", (sort, primary) => {
    const after = {
      courseId: "course-2",
      primary,
    }

    expect(resolveLearnerCourseCursorCondition(sort, after)).toEqual({
      kind: "invalid-primary",
    })
  })

  it("progress timestamp는 숫자 DESC이고 동률 course ID는 predicate adapter에 위임한다", () => {
    expect(
      resolveLearnerProgressCursorCondition({
        courseId: "course-2",
        primary: 1_752_000_000_000,
      })
    ).toEqual({
      courseId: "course-2",
      kind: "after",
      primary: 1_752_000_000_000,
      primaryOrder: "descending",
    })
    expect(
      resolveLearnerProgressCursorCondition({
        courseId: "course-2",
        primary: "1752000000000",
      })
    ).toEqual({ kind: "invalid-primary" })
  })

  it("cursor가 없으면 course와 progress 모두 첫 page condition을 반환한다", () => {
    expect(
      resolveLearnerCourseCursorCondition("recommended", undefined)
    ).toEqual({ kind: "first-page" })
    expect(resolveLearnerProgressCursorCondition(undefined)).toEqual({
      kind: "first-page",
    })
  })

  it.each([
    ["recommended", 9],
    ["title-asc", "normalized-title"],
    ["title-desc", "normalized-title"],
    ["lesson-count-asc", 4],
    ["lesson-count-desc", 4],
  ] as const)("%s course row에서 cursor primary를 읽는다", (sort, expected) => {
    expect(
      readLearnerCourseCursorPrimary(
        {
          lessonCount: 4,
          sortOrder: 9,
          titleSortKey: "normalized-title",
        },
        sort
      )
    ).toBe(expected)
  })
})
