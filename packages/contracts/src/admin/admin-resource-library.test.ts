import { describe, expect, it } from "vitest"

import {
  adminCreateResourceNodeRequestSchema,
  adminMoveResourceNodeRequestSchema,
  adminRenameResourceNodeRequestSchema,
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
} from "@workspace/contracts/admin/admin-resource-tree"
import {
  adminImportResourceDocumentRequestSchema,
  adminResourceDocumentDtoSchema,
} from "@workspace/contracts/admin/admin-resource-documents"
import { adminResourceSearchDtoSchema } from "@workspace/contracts/admin/admin-resource-search"

const documentNode = {
  hasChildren: false,
  id: "document-1",
  kind: "document",
  name: "운영 안내",
  parentId: "folder-1",
  sortOrder: 0,
  status: "active",
} as const

describe("자료실 트리·문서·검색 계약", () => {
  it("지연 트리와 구조 명령의 revision 계약을 파싱한다", () => {
    expect(
      adminResourceTreeDtoSchema.parse({
        nodes: [
          {
            hasChildren: true,
            id: "folder-1",
            kind: "folder",
            name: "운영",
            parentId: null,
            sortOrder: 0,
            status: "active",
          },
          documentNode,
        ],
        revision: 7,
      })
    ).toMatchObject({ revision: 7 })
    expect(
      adminCreateResourceNodeRequestSchema.parse({
        expectedRevision: 7,
        parentId: "folder-1",
      })
    ).toEqual({ expectedRevision: 7, parentId: "folder-1" })
    expect(
      adminRenameResourceNodeRequestSchema.parse({
        expectedRevision: 7,
        name: "  새 이름  ",
      })
    ).toEqual({ expectedRevision: 7, name: "새 이름" })
    expect(
      adminMoveResourceNodeRequestSchema.parse({
        destinationIndex: 2,
        destinationParentId: null,
        expectedRevision: 7,
      })
    ).toEqual({
      destinationIndex: 2,
      destinationParentId: null,
      expectedRevision: 7,
    })
    expect(
      adminResourceNodeMutationDtoSchema.parse({
        affectedParentIds: ["folder-1", null],
        node: documentNode,
        revision: 8,
      })
    ).toMatchObject({ revision: 8 })
    expect(
      adminResourceTrashResultDtoSchema.parse({
        affectedParentIds: ["folder-1"],
        documentCount: 3,
        folderCount: 2,
        revision: 8,
      })
    ).toMatchObject({ documentCount: 3, folderCount: 2 })
    expect(
      adminResourceRestoreResultDtoSchema.parse({
        affectedParentIds: ["folder-1"],
        documentCount: 3,
        folderCount: 2,
        node: { ...documentNode, status: "active" },
        revision: 9,
      })
    ).toMatchObject({ revision: 9 })
  })

  it("문서는 Markdown 원본, 수정 메타데이터와 전체 경로를 반환한다", () => {
    expect(
      adminResourceDocumentDtoSchema.parse({
        contentMarkdown: "## 시작\n\n본문",
        contentRevision: 3,
        createdAt: "2026-07-10T00:00:00.000Z",
        createdBy: {
          email: "creator@example.com",
          id: "admin-creator",
          name: "생성자",
        },
        id: "document-1",
        name: "운영 안내",
        parentId: "folder-1",
        path: [{ id: "folder-1", name: "운영" }],
        status: "active",
        updatedAt: "2026-07-10T01:00:00.000Z",
        updatedBy: {
          email: "editor@example.com",
          id: "admin-editor",
          name: "수정자",
        },
      })
    ).toMatchObject({ contentRevision: 3, name: "운영 안내" })
    expect(
      adminImportResourceDocumentRequestSchema.parse({
        expectedRevision: 3,
        fileName: "운영 안내.md",
        markdown: "# 운영 안내\n\n본문",
        parentId: null,
      })
    ).toMatchObject({ fileName: "운영 안내.md" })
  })

  it("검색 결과는 폴더와 문서의 경로 및 본문 문맥을 구분한다", () => {
    expect(
      adminResourceSearchDtoSchema.parse({
        items: [
          {
            excerpt: "실시간 공동 편집 안내",
            id: "document-1",
            kind: "document",
            name: "운영 안내",
            path: [{ id: "folder-1", name: "운영" }],
          },
          {
            excerpt: null,
            id: "folder-1",
            kind: "folder",
            name: "운영",
            path: [],
          },
        ],
      })
    ).toHaveProperty("items", expect.any(Array))
  })

  it("문서 node의 하위 항목 표시와 잘못된 가져오기 파일명을 거부한다", () => {
    expect(() =>
      adminResourceTreeDtoSchema.parse({
        nodes: [{ ...documentNode, hasChildren: true }],
        revision: 1,
      })
    ).toThrow()
    expect(() =>
      adminImportResourceDocumentRequestSchema.parse({
        expectedRevision: 0,
        fileName: "운영 안내.txt",
        markdown: "본문",
        parentId: null,
      })
    ).toThrow()
  })
})
