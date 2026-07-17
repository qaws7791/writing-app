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
const editorDocument = {
  category: "미분류",
  curriculumVersionId: "course-1-v1",
  description: "저장한 강의 설명",
  editVersion: 3,
  id: "course-1",
  revision: 1,
  status: "active",
  title: "저장한 코스",
  units: [
    {
      id: "course-1-unit-1",
      lessons: [
        {
          category: "미분류",
          description: "레슨 설명",
          estimatedMinutes: 5,
          id: "course-1-lesson-1",
          sortOrder: 1,
          status: "active",
          steps: [
            {
              body: "본문",
              guide: "",
              id: "course-1-step-1",
              sortOrder: 1,
              status: "active",
              title: "읽기",
              type: "READING",
            },
          ],
          summary: [],
          title: "레슨 1",
        },
      ],
      sortOrder: 1,
      status: "active",
      title: "유닛 1",
    },
  ],
} as const

const adminContentTargetContractInput = {
  cases: [
    {
      id: "list",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/courses?category=%EB%AF%B8%EB%B6%84%EB%A5%98&page=2&pageSize=5&query=%EC%BD%94%EC%8A%A4&status=active",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "list-invalid-page",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/courses?page=0",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "create-owner",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/courses",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "create-operator",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/courses",
      },
      responseBody: "json",
      scenario: "operator",
    },
    {
      id: "archive-missing",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "DELETE",
        path: "/courses/missing",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "editor-read",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/courses/course-1/editor",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "editor-missing",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/courses/missing/editor",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "editor-save",
      request: {
        body: { encoding: "utf8", value: JSON.stringify(editorDocument) },
        headers: [
          ["Content-Type", "application/json"],
          ["Cookie", adminCookie],
          ["If-Match", '"3"'],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PUT",
        path: "/courses/course-1/editor",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "editor-save-precondition",
      request: {
        body: { encoding: "utf8", value: JSON.stringify(editorDocument) },
        headers: [
          ["Content-Type", "application/json"],
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PUT",
        path: "/courses/course-1/editor",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "editor-save-stale",
      request: {
        body: { encoding: "utf8", value: JSON.stringify(editorDocument) },
        headers: [
          ["Content-Type", "application/json"],
          ["Cookie", adminCookie],
          ["If-Match", '"9"'],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PUT",
        path: "/courses/course-1/editor",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "editor-save-operator",
      request: {
        body: { encoding: "utf8", value: JSON.stringify(editorDocument) },
        headers: [
          ["Content-Type", "application/json"],
          ["Cookie", adminCookie],
          ["If-Match", '"3"'],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PUT",
        path: "/courses/course-1/editor",
      },
      responseBody: "json",
      scenario: "operator",
    },
    {
      id: "publish",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["If-Match", '"3"'],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/courses/course-1/publish",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "publish-invalid-draft",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["If-Match", '"3"'],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/courses/unpublishable/publish",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "openapi-content",
      openApiProjection: {
        components: [
          {
            names: ["adminSessionCookie"],
            section: "securitySchemes",
          },
        ],
        paths: [
          "/courses",
          "/courses/{courseId}",
          "/courses/{courseId}/editor",
          "/courses/{courseId}/publish",
        ],
      },
      request: { method: "GET", path: "/openapi" },
      responseBody: "openapi",
      scenario: "owner",
    },
  ],
  protocolVersion: adminTargetContractProtocolVersion,
  suite: "admin-content",
} as const satisfies AdminTargetContractRunInput

describe("관리자 Content delivery의 통합 runtime target 계약", () => {
  it("course, curriculum editor, 권한, validation, version conflict와 OpenAPI 계약을 보존한다", async () => {
    const evidence = await assertAdminTargetContract(
      adminContentTargetContractInput
    )

    expect(evidence.caseCount).toBe(
      adminContentTargetContractInput.cases.length
    )
    expect(readObservation(evidence, "list")).toMatchObject({
      body: {
        kind: "json",
        value: {
          pagination: {
            page: 2,
            pageSize: 5,
            totalItems: 1,
            totalPages: 1,
          },
        },
      },
      effectJournal: [
        {
          effect: "courses.list",
          input: {
            category: "미분류",
            page: 2,
            pageSize: 5,
            query: "코스",
            status: "active",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "list-invalid-page")).toMatchObject({
      body: {
        kind: "json",
        value: {
          code: "VALIDATION_FAILED",
          message: "Request validation failed",
        },
      },
      effectJournal: [],
      status: 400,
    })
    expect(readObservation(evidence, "create-owner")).toMatchObject({
      effectJournal: [
        {
          effect: "courses.create",
          input: {
            actor: {
              id: "admin-1",
              role: "owner",
            },
            now: "2026-06-14T03:00:00.000Z",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "create-operator")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "FORBIDDEN", message: "Forbidden" },
      },
      effectJournal: [],
      status: 403,
    })
    expect(readObservation(evidence, "archive-missing")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "NOT_FOUND", message: "Not Found" },
      },
      status: 404,
    })
    expect(readObservation(evidence, "editor-read")).toMatchObject({
      headers: {
        etag: ['"3"'],
      },
      status: 200,
    })
    expect(readObservation(evidence, "editor-missing")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "NOT_FOUND", message: "Not Found" },
      },
      status: 404,
    })
    expect(readObservation(evidence, "editor-save")).toMatchObject({
      body: {
        kind: "json",
        value: {
          editVersion: 4,
          title: "저장한 코스",
        },
      },
      headers: {
        etag: ['"4"'],
      },
      status: 200,
    })
    expect(readObservation(evidence, "editor-save-precondition")).toMatchObject(
      {
        body: {
          kind: "json",
          value: {
            code: "PRECONDITION_REQUIRED",
            message: "If-Match precondition required",
          },
        },
        effectJournal: [],
        status: 428,
      }
    )
    expect(readObservation(evidence, "editor-save-stale")).toMatchObject({
      body: {
        kind: "json",
        value: {
          code: "STALE_REVISION",
          message: "Course editor revision conflict",
        },
      },
      status: 409,
    })
    expect(readObservation(evidence, "editor-save-operator")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "FORBIDDEN", message: "Forbidden" },
      },
      effectJournal: [],
      status: 403,
    })
    expect(readObservation(evidence, "publish")).toMatchObject({
      body: {
        kind: "json",
        value: {
          curriculumVersionId: "course-1-v1",
          revision: 1,
        },
      },
      status: 200,
    })
    expect(readObservation(evidence, "publish-invalid-draft")).toMatchObject({
      body: {
        kind: "json",
        value: {
          code: "INVALID_REQUEST",
          message: "Course draft is not publishable",
        },
      },
      status: 422,
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
