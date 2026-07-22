import { describe, expect, it } from "vitest"

import {
  adminAiChangeProposalDtoSchema,
  adminAiChangeSchema,
} from "#contracts/operations/admin-ai-proposals"

describe("admin AI change proposal contract", () => {
  it("content draft와 resource document 변경안만 허용한다", () => {
    expect(
      adminAiChangeSchema.parse({
        courseId: "course-1",
        expectedEditVersion: 2,
        kind: "content-course-draft",
        title: "새 제목",
      })
    ).toMatchObject({ kind: "content-course-draft" })
    expect(
      adminAiChangeSchema.parse({
        contentMarkdown: "본문",
        documentId: "document-1",
        expectedVersion: 3,
        kind: "resource-document",
      })
    ).toMatchObject({ kind: "resource-document" })
  })

  it.each([
    "publish-content",
    "permanently-delete-resource",
    "change-permissions",
    "change-operations-settings",
  ])("금지된 변경 variant %s를 거절한다", (kind) => {
    expect(
      adminAiChangeSchema.safeParse({ expectedVersion: 1, kind }).success
    ).toBe(false)
  })

  it("검토 상태와 reviewer metadata를 canonical DTO로 파싱한다", () => {
    expect(
      adminAiChangeProposalDtoSchema.parse({
        change: {
          courseId: "course-1",
          expectedEditVersion: 2,
          kind: "content-course-draft",
          title: "새 제목",
        },
        conversationId: "conversation-1",
        createdAt: "2026-07-23T00:00:00.000Z",
        createdByAdminId: "admin-1",
        id: "proposal-1",
        reviewedAt: null,
        reviewedByAdminId: null,
        status: "proposed",
      })
    ).toMatchObject({ id: "proposal-1", status: "proposed" })
  })
})
