import { describe, expect, it } from "vitest"
import type {
  AdminId,
  AiChangeProposalId,
  ConversationId,
  CourseId,
} from "@workspace/types/ids"

import {
  authorizeAiCommand,
  decideProposalApplied,
  decideProposalReview,
  type AiChangeProposal,
} from "#operations/domain/ai-change-proposal"
import { decideAiRequestLimit } from "#operations/domain/ai-request-limit"

const adminId = "admin-1" as AdminId
const proposal: AiChangeProposal = {
  change: {
    courseId: "course-1" as CourseId,
    expectedEditVersion: 2,
    kind: "content-course-draft",
    title: "새 제목",
  },
  conversationId: "conversation-1" as ConversationId,
  createdAt: new Date("2026-07-23T00:00:00.000Z"),
  createdByAdminId: adminId,
  id: "proposal-1" as AiChangeProposalId,
  reviewedAt: null,
  reviewedByAdminId: null,
  status: "proposed",
}

describe("operations domain", () => {
  it.each([
    "publish-content",
    "permanently-delete-resource",
    "change-permissions",
    "change-operations-settings",
  ] as const)("AI 금지 command %s를 거절한다", (command) => {
    expect(authorizeAiCommand(command)).toBe("forbidden")
  })

  it("AI에는 content draft와 resource document 제안만 허용한다", () => {
    expect(authorizeAiCommand("propose-content-draft")).toBe("allowed")
    expect(authorizeAiCommand("propose-resource-document")).toBe("allowed")
  })

  it("승인은 proposed에서 applying을 거쳐 approved로만 전이한다", () => {
    const reviewed = decideProposalReview({
      decision: "approve",
      proposal,
      reviewedAt: new Date("2026-07-23T01:00:00.000Z"),
      reviewerId: adminId,
    })
    expect(reviewed).toMatchObject({ status: "applying" })
    if ("kind" in reviewed) throw new Error("승인 검토가 실패했습니다.")
    expect(decideProposalApplied(reviewed)).toMatchObject({
      status: "approved",
    })
    expect(
      decideProposalReview({
        decision: "approve",
        proposal: reviewed,
        reviewedAt: new Date("2026-07-23T01:01:00.000Z"),
        reviewerId: adminId,
      })
    ).toEqual({ kind: "conflict", reason: "proposal-already-reviewed" })
  })

  it("limit counter가 경계에 도달하면 안정된 원인과 Retry-After를 결정한다", () => {
    const now = new Date("2026-07-23T00:00:00.000Z")
    expect(
      decideAiRequestLimit({
        counters: [
          {
            count: 20,
            limit: 20,
            reason: "admin-minute",
            resetAt: new Date(now.getTime() + 30_001),
          },
        ],
        now,
      })
    ).toEqual({
      kind: "rejected",
      reason: "admin-minute",
      retryAfterSeconds: 31,
    })
  })
})
