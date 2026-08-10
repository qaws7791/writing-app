import { describe, expect, it } from "vitest"
import type { UserId } from "@workspace/types/ids"

import {
  createLearnerProfile,
  deletedLearnerDisplayName,
  transitionLearnerProfileStatus,
} from "#identity/domain/learner-profile"
import type { UserStatus } from "#identity/domain/user-status"

const userId = "user-1" as UserId
const now = new Date("2026-07-22T00:00:00.000Z")

describe("identity 학습자 profile 상태 전이", () => {
  it.each([
    ["active", "suspended"],
    ["active", "deleted"],
    ["suspended", "active"],
    ["suspended", "deleted"],
  ] as const)("%s → %s 전이를 허용한다", (from, to) => {
    const result = transitionLearnerProfileStatus({
      now,
      profile: profileWithStatus(from),
      status: to,
    })

    expect(result._unsafeUnwrap().status).toBe(to)
  })

  it.each([
    ["active", "active"],
    ["suspended", "suspended"],
    ["deleted", "active"],
    ["deleted", "suspended"],
    ["deleted", "deleted"],
  ] as const)("%s → %s 전이를 거절한다", (from, to) => {
    const result = transitionLearnerProfileStatus({
      now,
      profile: profileWithStatus(from),
      status: to,
    })

    expect(result._unsafeUnwrapErr()).toEqual({
      from,
      kind: "identity-invalid-status-transition",
      to,
    })
  })

  it("삭제 전이는 표시 이름을 비식별화하고 삭제 시각을 기록한다", () => {
    const result = transitionLearnerProfileStatus({
      now,
      profile: profileWithStatus("active"),
      status: "deleted",
    })

    expect(result._unsafeUnwrap()).toEqual({
      deletedAt: now,
      displayName: deletedLearnerDisplayName,
      status: "deleted",
      userId,
    })
  })
})

function profileWithStatus(status: UserStatus) {
  return createLearnerProfile({
    deletedAt: status === "deleted" ? now : null,
    displayName: status === "deleted" ? deletedLearnerDisplayName : "학습자",
    status,
    userId,
  })._unsafeUnwrap()
}
