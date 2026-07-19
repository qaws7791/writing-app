import { describe, expect, it } from "vitest"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  adminTargetContractProtocolVersion,
  type AdminTargetContractRunInput,
  type AdminTargetContractSemanticObservation,
} from "@/test-support/admin-target-contract"
import {
  assertAdminTargetContract,
  type AdminTargetContractEvidence,
} from "@/test-support/admin-target-contract-harness"

const adminOrigin = localRuntimeDefaults.adminWebOrigin
const adminCookie = `${adminSessionCookieName}=admin-token`
const mutationHeaders = [
  ["Content-Type", "application/json"],
  ["Cookie", adminCookie],
  ["Origin", adminOrigin],
  ["Sec-Fetch-Site", "same-origin"],
] as const
const rawPngMultipartBody =
  "LS1SZXNvdXJjZVRhcmdldENvbnRyYWN0Qm91bmRhcnkNCkNvbnRlbnQtRGlzcG9zaXRpb246IGZvcm0tZGF0YTsgbmFtZT0iYWx0VGV4dCINCg0K7Jq07JiBIO2ZlOuptA0KLS1SZXNvdXJjZVRhcmdldENvbnRyYWN0Qm91bmRhcnkNCkNvbnRlbnQtRGlzcG9zaXRpb246IGZvcm0tZGF0YTsgbmFtZT0iZmlsZSI7IGZpbGVuYW1lPSJyZXNvdXJjZS5wbmciDQpDb250ZW50LVR5cGU6IGltYWdlL3BuZw0KDQqJUE5HDQoaCg0KLS1SZXNvdXJjZVRhcmdldENvbnRyYWN0Qm91bmRhcnktLQ0K"

const adminResourceLibraryTargetContractInput = {
  cases: [
    {
      id: "tree-read",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/resources/tree?scope=trash",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "tree-read-unauthenticated",
      request: { method: "GET", path: "/resources/tree" },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "folder-create-operator",
      request: {
        body: { encoding: "utf8", value: '{"parentId":null}' },
        headers: mutationHeaders,
        method: "POST",
        path: "/resources/folders",
      },
      responseBody: "json",
      scenario: "operator",
    },
    {
      id: "document-node-create",
      request: {
        body: { encoding: "utf8", value: '{"parentId":"folder-1"}' },
        headers: mutationHeaders,
        method: "POST",
        path: "/resources/documents",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "folder-rename",
      request: {
        body: { encoding: "utf8", value: '{"name":"운영 기준"}' },
        headers: mutationHeaders,
        method: "PATCH",
        path: "/resources/folders/folder-1/name",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "node-move",
      request: {
        body: { encoding: "utf8", value: '{"destinationParentId":null}' },
        headers: mutationHeaders,
        method: "PATCH",
        path: "/resources/nodes/document-1/move",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "node-trash",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/resources/nodes/folder-1/trash",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "node-restore",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/resources/nodes/folder-1/restore",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "node-delete",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "DELETE",
        path: "/resources/nodes/folder-1",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "document-get",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/resources/documents/document-1",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "document-save",
      request: {
        body: {
          encoding: "utf8",
          value: '{"contentMarkdown":"저장한 본문","name":"저장한 운영 기준"}',
        },
        headers: [
          ["Content-Type", "application/json"],
          ["Cookie", adminCookie],
          ["If-Match", '"3"'],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PUT",
        path: "/resources/documents/document-1",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "document-save-precondition",
      request: {
        body: {
          encoding: "utf8",
          value: '{"contentMarkdown":"저장한 본문","name":"저장한 운영 기준"}',
        },
        headers: mutationHeaders,
        method: "PUT",
        path: "/resources/documents/document-1",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "document-import",
      request: {
        body: {
          encoding: "utf8",
          value:
            '{"fileName":"운영 기준.md","markdown":"# 운영 기준\\n\\n본문","parentId":"folder-1"}',
        },
        headers: mutationHeaders,
        method: "POST",
        path: "/resources/documents/import",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "document-export",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/resources/documents/document-1/export",
      },
      responseBody: "text",
      scenario: "owner",
    },
    {
      id: "image-upload-raw-png",
      request: {
        body: { encoding: "base64", value: rawPngMultipartBody },
        headers: [
          [
            "Content-Type",
            "multipart/form-data; boundary=ResourceTargetContractBoundary",
          ],
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/resources/documents/document-1/images",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "resource-search",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/resources/search?query=%20%EA%B2%80%EC%83%89%20&limit=5",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "openapi-resource-library",
      openApiProjection: {
        components: [
          {
            names: ["adminSessionCookie"],
            section: "securitySchemes",
          },
        ],
        paths: [
          "/api/admin/resources/documents",
          "/api/admin/resources/documents/import",
          "/api/admin/resources/documents/{documentId}",
          "/api/admin/resources/documents/{documentId}/export",
          "/api/admin/resources/documents/{documentId}/images",
          "/api/admin/resources/folders",
          "/api/admin/resources/folders/{folderId}/name",
          "/api/admin/resources/nodes/{nodeId}",
          "/api/admin/resources/nodes/{nodeId}/move",
          "/api/admin/resources/nodes/{nodeId}/restore",
          "/api/admin/resources/nodes/{nodeId}/trash",
          "/api/admin/resources/search",
          "/api/admin/resources/tree",
        ],
      },
      request: { method: "GET", path: "/openapi" },
      responseBody: "openapi",
      scenario: "owner",
    },
  ],
  protocolVersion: adminTargetContractProtocolVersion,
  suite: "admin-resource-library",
} as const satisfies AdminTargetContractRunInput

describe("관리자 Resource Library delivery의 통합 runtime target 계약", () => {
  it("14개 자료실 operation, 인증·operator, ETag, 파일 전송과 OpenAPI 계약을 보존한다", async () => {
    const evidence = await assertAdminTargetContract(
      adminResourceLibraryTargetContractInput
    )

    expect(evidence.caseCount).toBe(
      adminResourceLibraryTargetContractInput.cases.length
    )
    expect(readObservation(evidence, "tree-read")).toMatchObject({
      body: {
        kind: "json",
        value: {
          nodes: [
            { id: "folder-1", kind: "folder", status: "active" },
            { id: "document-1", kind: "document", status: "active" },
          ],
        },
      },
      effectJournal: [
        { effect: "tree.read", input: { scope: "trash" }, sequence: 1 },
      ],
      status: 200,
    })
    expect(
      readObservation(evidence, "tree-read-unauthenticated")
    ).toMatchObject({
      body: {
        kind: "json",
        value: { code: "UNAUTHORIZED", message: "Unauthorized" },
      },
      effectJournal: [],
      status: 401,
    })
    expect(readObservation(evidence, "folder-create-operator")).toMatchObject({
      body: {
        kind: "json",
        value: { node: { id: "folder-1", kind: "folder" } },
      },
      effectJournal: [
        {
          effect: "tree.create-folder",
          input: {
            actorId: "admin-1",
            now: "2026-07-18T00:00:00.000Z",
            parentId: null,
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "document-node-create")).toMatchObject({
      effectJournal: [
        {
          effect: "tree.create-document",
          input: {
            actorId: "admin-1",
            now: "2026-07-18T00:00:00.000Z",
            parentId: "folder-1",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "folder-rename")).toMatchObject({
      effectJournal: [
        {
          effect: "tree.rename-folder",
          input: {
            actorId: "admin-1",
            folderId: "folder-1",
            name: "운영 기준",
            now: "2026-07-18T00:00:00.000Z",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "node-move")).toMatchObject({
      effectJournal: [
        {
          effect: "tree.move",
          input: {
            actorId: "admin-1",
            destinationParentId: null,
            nodeId: "document-1",
            now: "2026-07-18T00:00:00.000Z",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "node-trash")).toMatchObject({
      effectJournal: [
        {
          effect: "tree.trash",
          input: {
            actorId: "admin-1",
            nodeId: "folder-1",
            now: "2026-07-18T00:00:00.000Z",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "node-restore")).toMatchObject({
      body: {
        kind: "json",
        value: { documentCount: 1, folderCount: 1 },
      },
      effectJournal: [
        {
          effect: "tree.restore",
          input: {
            actorId: "admin-1",
            nodeId: "folder-1",
            now: "2026-07-18T00:00:00.000Z",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "node-delete")).toMatchObject({
      body: {
        kind: "json",
        value: { documentCount: 1, folderCount: 2 },
      },
      effectJournal: [
        {
          effect: "tree.delete-permanently",
          input: {
            actorId: "admin-1",
            nodeId: "folder-1",
            now: "2026-07-18T00:00:00.000Z",
          },
          sequence: 1,
        },
        {
          effect: "assets.delete-objects",
          input: {
            objectKeys: ["resource-library/document-1/resource-asset-1.png"],
          },
          sequence: 2,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "node-delete")).not.toHaveProperty(
      "body.value.r2ObjectKeys"
    )
    expect(readObservation(evidence, "document-get")).toMatchObject({
      headers: { etag: ['"3"'] },
      status: 200,
    })
    expect(readObservation(evidence, "document-save")).toMatchObject({
      body: {
        kind: "json",
        value: { name: "저장한 운영 기준", version: 4 },
      },
      headers: { etag: ['"4"'] },
      status: 200,
    })
    expect(
      readObservation(evidence, "document-save-precondition")
    ).toMatchObject({
      body: {
        kind: "json",
        value: {
          code: "PRECONDITION_REQUIRED",
          message: "If-Match precondition required",
        },
      },
      effectJournal: [],
      status: 428,
    })
    expect(readObservation(evidence, "document-import")).toMatchObject({
      body: {
        kind: "json",
        value: {
          document: { id: "document-1" },
          mutation: { node: { id: "document-1", kind: "document" } },
        },
      },
      status: 200,
    })
    expect(readObservation(evidence, "document-export")).toMatchObject({
      body: { kind: "text", value: "# 운영 기준\n\n본문" },
      headers: {
        "content-disposition": [
          "attachment; filename*=UTF-8''%EC%9A%B4%EC%98%81%20%EA%B8%B0%EC%A4%80.md",
        ],
        "content-type": ["text/markdown; charset=UTF-8"],
      },
      status: 200,
    })
    expect(readObservation(evidence, "image-upload-raw-png")).toMatchObject({
      body: {
        kind: "json",
        value: {
          altText: "운영 화면",
          byteSize: 8,
          contentType: "image/png",
          id: "resource-asset-1",
        },
      },
      effectJournal: [
        {
          effect: "documents.get",
          input: { documentId: "document-1" },
          sequence: 1,
        },
        {
          effect: "assets.put-object",
          input: {
            byteSize: 8,
            contentType: "image/png",
            objectKey: "resource-library/document-1/resource-asset-1.png",
          },
          sequence: 2,
        },
        {
          effect: "assets.register-image",
          input: {
            assetId: "resource-asset-1",
            byteSize: 8,
            contentType: "image/png",
            createdAt: "2026-07-18T00:00:00.000Z",
            documentId: "document-1",
            objectKey: "resource-library/document-1/resource-asset-1.png",
          },
          sequence: 3,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "resource-search")).toMatchObject({
      body: {
        kind: "json",
        value: { items: [{ id: "document-1", name: "운영 기준" }] },
      },
      effectJournal: [
        {
          effect: "search.resources",
          input: { limit: 5, query: "검색" },
          sequence: 1,
        },
      ],
      status: 200,
    })
  }, 15_000)
})

function readObservation(
  evidence: AdminTargetContractEvidence,
  id: string
): AdminTargetContractSemanticObservation {
  const observation = evidence.target.observations.find(
    (candidate) => candidate.id === id
  )

  if (observation === undefined) {
    throw new Error(`target contract 관찰값을 찾을 수 없습니다: ${id}`)
  }

  return observation
}
