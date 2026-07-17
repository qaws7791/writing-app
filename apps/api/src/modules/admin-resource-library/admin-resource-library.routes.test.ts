import { describe, expect, it } from "vitest"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createAdminResourceLibraryTargetRouteFixture } from "@/test-support/admin-resource-library-target-route-fixture"

const adminCookie = `${adminSessionCookieName}=admin-token`

describe("통합 관리자 자료실 target route", () => {
  it("세션 없는 자료실 조회를 effect 없이 401로 거절한다", async () => {
    const fixture = createAdminResourceLibraryTargetRouteFixture("owner")

    const response = await fixture.fetch(createRequest("/resources/tree"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
    expect(fixture.readEffectJournal()).toEqual([])
  })

  it("operator 자료실 폴더 생성은 기존 admin session 계약으로 전달한다", async () => {
    const fixture = createAdminResourceLibraryTargetRouteFixture("operator")

    const response = await fixture.fetch(
      createRequest("/resources/folders", {
        body: JSON.stringify({ parentId: null }),
        headers: mutationHeaders(),
        method: "POST",
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      node: { id: "folder-1", kind: "folder" },
    })
    expect(fixture.readEffectJournal()).toEqual([
      {
        effect: "tree.create-folder",
        input: {
          actorId: "admin-1",
          now: "2026-07-18T00:00:00.000Z",
          parentId: null,
        },
        sequence: 1,
      },
    ])
  })

  it("문서 조회와 조건부 저장의 ETag 계약을 target route에서 유지한다", async () => {
    const fixture = createAdminResourceLibraryTargetRouteFixture("owner")

    const readResponse = await fixture.fetch(
      createRequest("/resources/documents/document-1", {
        headers: { Cookie: adminCookie },
      })
    )
    const saveResponse = await fixture.fetch(
      createRequest("/resources/documents/document-1", {
        body: JSON.stringify({
          contentMarkdown: "저장한 본문",
          name: "저장한 운영 기준",
        }),
        headers: {
          ...mutationHeaders(),
          "If-Match": '"3"',
        },
        method: "PUT",
      })
    )

    expect(readResponse.status).toBe(200)
    expect(readResponse.headers.get("ETag")).toBe('"3"')
    expect(saveResponse.status).toBe(200)
    expect(saveResponse.headers.get("ETag")).toBe('"4"')
    await expect(saveResponse.json()).resolves.toMatchObject({
      name: "저장한 운영 기준",
      version: 4,
    })
    expect(fixture.readEffectJournal()).toEqual([
      {
        effect: "documents.get",
        input: { documentId: "document-1" },
        sequence: 1,
      },
      {
        effect: "documents.save",
        input: {
          actorId: "admin-1",
          contentMarkdown: "저장한 본문",
          documentId: "document-1",
          expectedVersion: 3,
          name: "저장한 운영 기준",
          now: "2026-07-18T00:00:00.000Z",
        },
        sequence: 2,
      },
    ])
  })

  it("자료실 OpenAPI가 열네 target operation과 조건부 저장 오류 응답을 등록한다", async () => {
    const fixture = createAdminResourceLibraryTargetRouteFixture("owner")

    const response = await fixture.fetch(createRequest("/openapi"))
    const document = await response.json()

    expect(response.status).toBe(200)
    for (const [path, method, operationId] of [
      ["/resources/tree", "get", "getAdminResourceTree"],
      ["/resources/folders", "post", "createAdminResourceFolder"],
      ["/resources/documents", "post", "createAdminResourceDocumentNode"],
      [
        "/resources/folders/{folderId}/name",
        "patch",
        "renameAdminResourceFolder",
      ],
      ["/resources/nodes/{nodeId}/move", "patch", "moveAdminResourceNode"],
      ["/resources/nodes/{nodeId}/trash", "post", "trashAdminResourceNode"],
      ["/resources/nodes/{nodeId}/restore", "post", "restoreAdminResourceNode"],
      [
        "/resources/nodes/{nodeId}",
        "delete",
        "deleteAdminResourceNodePermanently",
      ],
      [
        "/resources/documents/{documentId}/images",
        "post",
        "uploadAdminResourceLibraryImage",
      ],
      [
        "/resources/documents/{documentId}",
        "get",
        "getAdminResourceLibraryDocument",
      ],
      [
        "/resources/documents/{documentId}",
        "put",
        "saveAdminResourceLibraryDocument",
      ],
      [
        "/resources/documents/import",
        "post",
        "importAdminResourceLibraryDocument",
      ],
      [
        "/resources/documents/{documentId}/export",
        "get",
        "exportAdminResourceLibraryDocument",
      ],
      ["/resources/search", "get", "searchAdminResourceLibrary"],
    ] as const) {
      expect(document).toHaveProperty(
        ["paths", path, method, "operationId"],
        operationId
      )
    }
    expect(document).toHaveProperty([
      "paths",
      "/resources/documents/{documentId}",
      "put",
      "responses",
      "428",
    ])
  })
})

function createRequest(path: string, init: RequestInit = {}): Request {
  return new Request(new URL(path, "http://admin-api.localhost:4000"), init)
}

function mutationHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Cookie: adminCookie,
    Origin: localRuntimeDefaults.adminWebOrigin,
    "Sec-Fetch-Site": "same-origin",
  }
}
