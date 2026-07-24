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
  it("공백 이름을 거절하고 표시 이름을 정규화한다", () => {
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
  })

  it.each([
    ["active", "active", false],
    ["active", "suspended", true],
    ["active", "deleted", true],
    ["suspended", "active", true],
    ["suspended", "suspended", false],
    ["suspended", "deleted", true],
    ["deleted", "active", false],
    ["deleted", "suspended", false],
    ["deleted", "deleted", false],
  ] as const)("%s → %s 상태 전이 허용 여부를 고정한다", (from, to, allowed) => {
    const profile = createLearnerProfile({
      deletedAt: from === "deleted" ? now : null,
      displayName: from === "deleted" ? deletedLearnerDisplayName : "학습자",
      status: from,
      userId,
    })._unsafeUnwrap()
    const decision = transitionLearnerProfileStatus({
      now,
      profile,
      status: to,
    })

    expect(decision.isOk()).toBe(allowed)
    if (decision.isErr()) {
      expect(decision.error).toEqual({
        from,
        kind: "identity-invalid-status-transition",
        to,
      })
    }
  })

  it("삭제 전이는 노출 이름을 비식별화하고 이후 이름 변경을 거절한다", () => {
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
      })._unsafeUnwrapErr()
    ).toEqual({
      from: "deleted",
      kind: "identity-invalid-status-transition",
      to: "active",
    })
  })
})
