import { describe, expect, it } from "vitest"
import type { UserId } from "@workspace/types/ids"

import {
  changeLearnerDisplayName,
  createLearnerProfile,
  deletedLearnerDisplayName,
  transitionLearnerProfileStatus,
} from "#identity/domain/learner-profile"

const userId = "user-1" as UserId
const now = new Date("2026-07-22T00:00:00.000Z")

describe("identity 학습자 profile aggregate", () => {
  it("표시 이름 invariant를 적용하고 정상 profile을 immutable 값으로 만든다", () => {
    expect(
      createLearnerProfile({ displayName: "   ", userId })._unsafeUnwrapErr()
    ).toEqual({ kind: "identity-invalid-profile" })

    const profile = createLearnerProfile({
      displayName: "  글쓰기 탐험가  ",
      userId,
    })._unsafeUnwrap()

    expect(profile).toEqual({
      deletedAt: null,
      displayName: "글쓰기 탐험가",
      status: "active",
      userId,
    })
    expect(Object.isFrozen(profile)).toBe(true)
  })

  it("상태 전이에서 새 immutable profile을 반환한다", () => {
    const profile = createLearnerProfile({
      displayName: "학습자",
      userId,
    })._unsafeUnwrap()
    const decision = transitionLearnerProfileStatus({
      now,
      profile,
      status: "suspended",
    })._unsafeUnwrap()

    expect(decision).toMatchObject({
      displayName: "학습자",
      status: "suspended",
    })
    expect(Object.isFrozen(decision)).toBe(true)
  })

  it("동일 상태 전이를 거절한다", () => {
    const profile = createLearnerProfile({
      displayName: "학습자",
      status: "suspended",
      userId,
    })._unsafeUnwrap()

    expect(
      transitionLearnerProfileStatus({
        now,
        profile,
        status: "suspended",
      })._unsafeUnwrapErr()
    ).toEqual({
      from: "suspended",
      kind: "identity-invalid-status-transition",
      to: "suspended",
    })
  })

  it("삭제 전이는 노출 이름을 비식별화하고 상태 복구 전 이름 변경을 거절한다", () => {
    const profile = createLearnerProfile({
      displayName: "실명",
      userId,
    })._unsafeUnwrap()
    const deleted = transitionLearnerProfileStatus({
      now,
      profile,
      status: "deleted",
    })._unsafeUnwrap()

    expect(deleted).toEqual({
      deletedAt: now,
      displayName: deletedLearnerDisplayName,
      status: "deleted",
      userId,
    })
    expect(
      changeLearnerDisplayName({
        displayName: "다시 실명",
        profile: deleted,
      })._unsafeUnwrapErr()
    ).toEqual({ kind: "identity-deleted" })
    expect(
      transitionLearnerProfileStatus({
        now,
        profile: deleted,
        status: "active",
      })._unsafeUnwrap()
    ).toEqual({
      deletedAt: null,
      displayName: deletedLearnerDisplayName,
      status: "active",
      userId,
    })
  })
})
