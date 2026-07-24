import { describe, expect, it } from "vitest"

import { requireDeletedLearnerPurgeApproval } from "@/scripts/purge-deleted-learners"

describe("삭제 학습자 purge CLI", () => {
  it("명시적 대상과 승인이 모두 일치해야 실행을 허용한다", () => {
    expect(() => requireDeletedLearnerPurgeApproval({})).toThrow(
      /명시적인 DATABASE_URL/u
    )
    expect(() =>
      requireDeletedLearnerPurgeApproval({
        DATABASE_URL: "production.sqlite",
      })
    ).toThrow(/APPROVED=true/u)
    expect(() =>
      requireDeletedLearnerPurgeApproval({
        DATABASE_URL: "production.sqlite",
        DELETED_LEARNER_PURGE_APPROVED: "true",
        DELETED_LEARNER_PURGE_EXPECTED_DATABASE_URL: "other.sqlite",
      })
    ).toThrow(/확인값/u)
    expect(
      requireDeletedLearnerPurgeApproval({
        DATABASE_URL: "production.sqlite",
        DELETED_LEARNER_PURGE_APPROVED: "true",
        DELETED_LEARNER_PURGE_EXPECTED_DATABASE_URL: "production.sqlite",
      })
    ).toBe("production.sqlite")
  })
})
