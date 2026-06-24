import { describe, expect, it } from "vitest"

import { createApp, type AdminApiDependencies } from "@/app"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminResourceDocumentDetailDto,
  AdminResourceDocumentListDto,
} from "@workspace/contracts/admin"

const documentContent: AdminResourceDocumentDetailDto["content"] = {
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

const documentDetail: AdminResourceDocumentDetailDto = {
  author: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
  content: documentContent,
  createdAt: "2026-06-14T03:00:00.000Z",
  excerpt: "운영 자료 본문",
  id: "resource-1",
  status: "active",
  title: "운영 자료",
  updatedAt: "2026-06-14T03:00:00.000Z",
}

const documentList: AdminResourceDocumentListDto = {
  items: [
    {
      author: documentDetail.author,
      createdAt: documentDetail.createdAt,
      excerpt: documentDetail.excerpt,
      id: documentDetail.id,
      status: documentDetail.status,
      title: documentDetail.title,
      updatedAt: documentDetail.updatedAt,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 1,
    totalPages: 1,
  },
}

describe("어드민 API resources route", () => {
  it("관리자 세션이 없으면 자료실 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/resources")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  })

  it("자료 목록 query를 파싱해 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/resources?page=1&pageSize=20&query=%EC%9A%B4%EC%98%81&status=active",
      {
        headers: {
          Authorization: "Bearer admin-token",
        },
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(documentList)
  })

  it("자료 상세, 생성, 수정을 제공한다", async () => {
    const app = createApp(createDependencies())
    const headers = {
      Authorization: "Bearer admin-token",
      "Content-Type": "application/json",
    }

    const detailResponse = await app.request("/resources/resource-1", {
      headers,
    })

    expect(detailResponse.status).toBe(200)
    await expect(detailResponse.json()).resolves.toEqual(documentDetail)

    const createResponse = await app.request("/resources", {
      body: JSON.stringify({
        content: documentContent,
        title: "운영 자료",
      }),
      headers,
      method: "POST",
    })

    expect(createResponse.status).toBe(200)
    await expect(createResponse.json()).resolves.toEqual(documentDetail)

    const updateResponse = await app.request("/resources/resource-1", {
      body: JSON.stringify({
        content: documentContent,
        title: "운영 자료",
      }),
      headers,
      method: "PUT",
    })

    expect(updateResponse.status).toBe(200)
    await expect(updateResponse.json()).resolves.toEqual(documentDetail)
  })

  it("작성자 자료 보관과 삭제 결과를 반환한다", async () => {
    const app = createApp(createDependencies())
    const headers = {
      Authorization: "Bearer admin-token",
    }

    const archiveResponse = await app.request("/resources/resource-1/archive", {
      headers,
      method: "PATCH",
    })

    expect(archiveResponse.status).toBe(200)
    await expect(archiveResponse.json()).resolves.toEqual({ archived: true })

    const deleteResponse = await app.request("/resources/resource-1", {
      headers,
      method: "DELETE",
    })

    expect(deleteResponse.status).toBe(200)
    await expect(deleteResponse.json()).resolves.toEqual({ deleted: true })
  })

  it("작성자가 아닌 자료 보관 결과는 403으로 매핑한다", async () => {
    const app = createApp(
      createDependencies({
        archiveResult: { kind: "forbidden" },
      })
    )

    const response = await app.request("/resources/resource-1/archive", {
      headers: {
        Authorization: "Bearer admin-token",
      },
      method: "PATCH",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })
})

function createDependencies({
  archiveResult = {
    kind: "ok",
    value: { archived: true },
  } as const,
}: {
  readonly archiveResult?:
    | {
        readonly kind: "forbidden"
      }
    | {
        readonly kind: "ok"
        readonly value: {
          readonly archived: true
        }
      }
} = {}): AdminApiDependencies {
  return createTestAdminApiDependencies({
    adminServices: {
      resources: {
        async archiveResourceDocument(input) {
          expect(input).toEqual({
            adminId: "admin-1",
            documentId: "resource-1",
            now: testAdminNow,
          })
          return archiveResult
        },
        async createResourceDocument(input) {
          expect(input).toEqual({
            adminId: "admin-1",
            content: documentContent,
            now: testAdminNow,
            title: "운영 자료",
          })
          return documentDetail
        },
        async deleteResourceDocument(input) {
          expect(input).toEqual({
            adminId: "admin-1",
            documentId: "resource-1",
          })
          return {
            kind: "ok",
            value: { deleted: true },
          }
        },
        async getResourceDocument(input) {
          expect(input.documentId).toBe("resource-1")
          return documentDetail
        },
        async getResourceDocuments(input) {
          expect(input).toEqual({
            page: 1,
            pageSize: 20,
            query: "운영",
            status: "active",
          })
          return documentList
        },
        async updateResourceDocument(input) {
          expect(input).toEqual({
            content: documentContent,
            documentId: "resource-1",
            now: testAdminNow,
            title: "운영 자료",
          })
          return documentDetail
        },
      },
    },
  })
}
