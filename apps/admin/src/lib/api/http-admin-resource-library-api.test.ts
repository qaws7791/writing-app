import { describe, expect, it } from "vitest"

import { createHttpAdminApi } from "@/lib/api/http-admin-api"
import { readAdminApiBaseUrl } from "@/runtime-config"

const documentNode = {
  hasChildren: false,
  id: "document-1",
  kind: "document",
  name: "운영 안내",
  parentId: "folder-1",
  sortOrder: 0,
  status: "active",
} as const

const mutation = {
  affectedParentIds: ["folder-1"],
  node: documentNode,
  revision: 5,
} as const

const document = {
  contentMarkdown: "공동 편집 본문",
  contentRevision: 2,
  createdAt: "2026-06-14T03:00:00.000Z",
  createdBy: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
  id: "document-1",
  name: "운영 안내",
  parentId: "folder-1",
  path: [{ id: "folder-1", name: "운영" }],
  status: "active",
  updatedAt: "2026-06-14T03:00:00.000Z",
  updatedBy: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
} as const

describe("자료실 HTTP AdminApi", () => {
  it("트리·문서·검색 endpoint와 Markdown 내보내기를 새 계약으로 호출한다", async () => {
    const requests: Request[] = []
    const bodies: unknown[] = []
    const api = createHttpAdminApi({
      baseUrl: readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.example.test/",
      }),
      fetch: async (request) => {
        requests.push(request)

        if (request.headers.has("Content-Type")) {
          bodies.push(await request.clone().json())
        }

        return responseFor(request)
      },
      tokenProvider: () => "admin-token",
    })

    await expect(
      api.getResourceTree({ parentId: "folder-1", scope: "active" })
    ).resolves.toEqual({
      status: "ok",
      value: { nodes: [documentNode], revision: 4 },
    })
    await expect(
      api.createResourceFolder({ expectedRevision: 4, parentId: "folder-1" })
    ).resolves.toEqual({ status: "ok", value: mutation })
    await expect(
      api.createResourceDocumentNode({
        expectedRevision: 4,
        parentId: "folder-1",
      })
    ).resolves.toEqual({ status: "ok", value: mutation })
    await expect(
      api.renameResourceNode("document-1", {
        expectedRevision: 4,
        name: "운영 안내",
      })
    ).resolves.toEqual({ status: "ok", value: mutation })
    await expect(
      api.moveResourceNode("document-1", {
        destinationIndex: 0,
        destinationParentId: null,
        expectedRevision: 4,
      })
    ).resolves.toEqual({ status: "ok", value: mutation })
    await expect(
      api.getResourceActiveEditorCount("document-1")
    ).resolves.toEqual({
      status: "ok",
      value: { activeEditorCount: 2 },
    })
    await expect(
      api.trashResourceNode("document-1", { expectedRevision: 4 })
    ).resolves.toMatchObject({
      status: "ok",
      value: { documentCount: 1, folderCount: 0 },
    })
    await expect(
      api.restoreResourceNode("document-1", { expectedRevision: 5 })
    ).resolves.toMatchObject({
      status: "ok",
      value: { documentCount: 1, folderCount: 0, node: documentNode },
    })
    await expect(api.getResourceLibraryDocument("document-1")).resolves.toEqual(
      { status: "ok", value: document }
    )
    await expect(
      api.importResourceDocument({
        expectedRevision: 4,
        fileName: "운영 안내.md",
        markdown: "# 운영 안내\n\n공동 편집 본문",
        parentId: "folder-1",
      })
    ).resolves.toEqual({
      status: "ok",
      value: { document, mutation },
    })
    await expect(api.exportResourceDocument("document-1")).resolves.toEqual({
      status: "ok",
      value: {
        fileName: "운영 안내.md",
        markdown: "# 운영 안내\n\n공동 편집 본문",
      },
    })
    await expect(
      api.searchResources({ limit: 20, query: "공동", scope: "active" })
    ).resolves.toEqual({
      status: "ok",
      value: {
        items: [
          {
            excerpt: "공동 편집 본문",
            id: "document-1",
            kind: "document",
            name: "운영 안내",
            path: [{ id: "folder-1", name: "운영" }],
          },
        ],
      },
    })

    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      [
        "GET",
        "https://admin-api.example.test/resources/tree?parentId=folder-1&scope=active",
      ],
      ["POST", "https://admin-api.example.test/resources/folders"],
      ["POST", "https://admin-api.example.test/resources/documents"],
      [
        "PATCH",
        "https://admin-api.example.test/resources/nodes/document-1/name",
      ],
      [
        "PATCH",
        "https://admin-api.example.test/resources/nodes/document-1/move",
      ],
      [
        "GET",
        "https://admin-api.example.test/resources/nodes/document-1/active-editors",
      ],
      [
        "POST",
        "https://admin-api.example.test/resources/nodes/document-1/trash",
      ],
      [
        "POST",
        "https://admin-api.example.test/resources/nodes/document-1/restore",
      ],
      ["GET", "https://admin-api.example.test/resources/documents/document-1"],
      ["POST", "https://admin-api.example.test/resources/documents/import"],
      [
        "GET",
        "https://admin-api.example.test/resources/documents/document-1/export",
      ],
      [
        "GET",
        "https://admin-api.example.test/resources/search?limit=20&query=%EA%B3%B5%EB%8F%99&scope=active",
      ],
    ])
    expect(bodies).toEqual([
      { expectedRevision: 4, parentId: "folder-1" },
      { expectedRevision: 4, parentId: "folder-1" },
      { expectedRevision: 4, name: "운영 안내" },
      {
        destinationIndex: 0,
        destinationParentId: null,
        expectedRevision: 4,
      },
      { expectedRevision: 4 },
      { expectedRevision: 5 },
      {
        expectedRevision: 4,
        fileName: "운영 안내.md",
        markdown: "# 운영 안내\n\n공동 편집 본문",
        parentId: "folder-1",
      },
    ])
  })

  it("구조 명령 충돌 코드를 UI가 구분할 수 있는 오류로 보존한다", async () => {
    const api = createHttpAdminApi({
      baseUrl: readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.example.test/",
      }),
      fetch: async () =>
        new Response(
          JSON.stringify({
            code: "STALE_REVISION",
            message: "Resource library conflict",
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 409,
          }
        ),
      tokenProvider: () => "admin-token",
    })

    await expect(
      api.renameResourceNode("document-1", {
        expectedRevision: 4,
        name: "운영 안내",
      })
    ).resolves.toEqual({
      error: {
        code: "stale-revision",
        message: "다른 사용자의 변경 사항을 다시 불러옵니다.",
        status: 409,
      },
      status: "error",
    })
  })
})

function responseFor(request: Request): Response {
  if (request.url.includes("/resources/tree?")) {
    return jsonResponse({ nodes: [documentNode], revision: 4 })
  }

  if (request.url.endsWith("/export")) {
    return new Response("# 운영 안내\n\n공동 편집 본문", {
      headers: {
        "Content-Disposition":
          "attachment; filename*=UTF-8''%EC%9A%B4%EC%98%81%20%EC%95%88%EB%82%B4.md",
        "Content-Type": "text/markdown; charset=UTF-8",
      },
    })
  }

  if (request.url.includes("/resources/search?")) {
    return jsonResponse({
      items: [
        {
          excerpt: "공동 편집 본문",
          id: "document-1",
          kind: "document",
          name: "운영 안내",
          path: [{ id: "folder-1", name: "운영" }],
        },
      ],
    })
  }

  if (request.url.endsWith("/active-editors")) {
    return jsonResponse({ activeEditorCount: 2 })
  }

  if (
    request.method === "GET" &&
    request.url.endsWith("/resources/documents/document-1")
  ) {
    return jsonResponse(document)
  }

  if (request.url.endsWith("/resources/documents/import")) {
    return jsonResponse({ document, mutation })
  }

  if (request.url.endsWith("/trash")) {
    return jsonResponse({
      affectedParentIds: ["folder-1"],
      closedActiveRoomCount: 0,
      documentCount: 1,
      folderCount: 0,
      revision: 5,
    })
  }

  if (request.url.endsWith("/restore")) {
    return jsonResponse({
      affectedParentIds: ["folder-1"],
      documentCount: 1,
      folderCount: 0,
      node: documentNode,
      revision: 6,
    })
  }

  return jsonResponse(mutation)
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  })
}
