import { describe, expect, it } from "vitest"

import {
  adminResourceDocumentDetailDtoSchema,
  adminResourceDocumentListDtoSchema,
  adminResourceDocumentRequestSchema,
} from "@workspace/contracts/admin/admin-resources"

const content = {
  content: [
    {
      content: [
        {
          text: "운영 자료 본문",
          type: "text",
        },
      ],
      type: "paragraph",
    },
  ],
  type: "doc",
}

const listItem = {
  author: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
  createdAt: "2026-06-14T03:00:00.000Z",
  excerpt: "운영 자료 본문",
  id: "resource-1",
  status: "active",
  title: "운영 자료",
  updatedAt: "2026-06-14T03:00:00.000Z",
}

describe("admin resource contracts", () => {
  it("자료실 목록, 상세, 쓰기 요청을 파싱한다", () => {
    expect(
      adminResourceDocumentListDtoSchema.parse({
        items: [listItem],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      })
    ).toEqual({
      items: [listItem],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      },
    })

    expect(
      adminResourceDocumentDetailDtoSchema.parse({
        ...listItem,
        content,
      })
    ).toEqual({
      ...listItem,
      content,
    })

    expect(
      adminResourceDocumentRequestSchema.parse({
        content,
        title: "운영 자료",
      })
    ).toEqual({
      content,
      title: "운영 자료",
    })
  })

  it("지원하지 않는 Tiptap 노드는 거부한다", () => {
    expect(() =>
      adminResourceDocumentRequestSchema.parse({
        content: {
          content: [
            {
              type: "image",
            },
          ],
          type: "doc",
        },
        title: "운영 자료",
      })
    ).toThrow()
  })
})
