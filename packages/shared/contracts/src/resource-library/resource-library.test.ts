import { describe, expect, it } from "vitest"

import {
  adminResourceDocumentDtoSchema,
  adminSaveResourceDocumentRequestSchema,
} from "#contracts/resource-library/admin-resource-documents"
import {
  adminMoveResourceNodeRequestSchema,
  adminResourceTreeDtoSchema,
} from "#contracts/resource-library/admin-resource-tree"

describe("관리자 자료실 계약", () => {
  it("문서는 Markdown과 단일 버전을 함께 전달한다", () => {
    const document = adminResourceDocumentDtoSchema.parse({
      contentMarkdown: "본문",
      createdAt: "2026-07-16T00:00:00.000Z",
      createdBy: { email: "admin@example.com", id: "admin-1", name: "관리자" },
      id: "document-1",
      name: "문서",
      parentId: null,
      path: [],
      status: "active",
      updatedAt: "2026-07-16T00:00:00.000Z",
      updatedBy: { email: "admin@example.com", id: "admin-1", name: "관리자" },
      version: 3,
    })
    expect(document.version).toBe(3)
  })

  it("이동 계약은 대상 폴더만 받는다", () => {
    expect(
      adminMoveResourceNodeRequestSchema.parse({
        destinationParentId: "folder-1",
      })
    ).toEqual({ destinationParentId: "folder-1" })
  })

  it("트리와 저장 계약에 revision과 정렬 위치가 없다", () => {
    expect(adminResourceTreeDtoSchema.parse({ nodes: [] })).toEqual({
      nodes: [],
    })
    expect(
      adminSaveResourceDocumentRequestSchema.parse({
        contentMarkdown: "본문",
        name: "문서",
      })
    ).toEqual({ contentMarkdown: "본문", name: "문서" })
  })
})
