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

const adminIdentityTargetContractInput = {
  cases: [
    {
      id: "users-unauthenticated",
      request: { method: "GET", path: "/users" },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "users-page",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/users?page=1&pageSize=12&query=%ED%95%99%EC%8A%B5&status=active&sort=lastActive",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "users-invalid-page-size",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/users?pageSize=101",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "user-detail",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/users/user-1",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "missing-user-detail",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/users/missing",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "owner-status-update",
      request: {
        body: { encoding: "utf8", value: '{"status":"suspended"}' },
        headers: [
          ["Cookie", adminCookie],
          ["Content-Type", "application/json"],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PATCH",
        path: "/users/user-1/status",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "owner-delete",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "DELETE",
        path: "/users/user-1",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "missing-user-status-update",
      request: {
        body: { encoding: "utf8", value: '{"status":"suspended"}' },
        headers: [
          ["Cookie", adminCookie],
          ["Content-Type", "application/json"],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PATCH",
        path: "/users/missing/status",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "operator-status-update",
      request: {
        body: { encoding: "utf8", value: '{"status":"suspended"}' },
        headers: [
          ["Cookie", adminCookie],
          ["Content-Type", "application/json"],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PATCH",
        path: "/users/user-1/status",
      },
      responseBody: "json",
      scenario: "operator",
    },
    {
      id: "operator-delete",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "DELETE",
        path: "/users/user-1",
      },
      responseBody: "json",
      scenario: "operator",
    },
    {
      id: "identity-openapi",
      openApiProjection: {
        components: [
          {
            names: ["adminSessionCookie"],
            section: "securitySchemes",
          },
        ],
        paths: ["/users", "/users/{userId}", "/users/{userId}/status"],
      },
      request: { method: "GET", path: "/openapi" },
      responseBody: "openapi",
      scenario: "default",
    },
  ],
  protocolVersion: adminTargetContractProtocolVersion,
  suite: "admin-identity",
} as const satisfies AdminTargetContractRunInput

describe("관리자 identity delivery의 통합 runtime target 계약", () => {
  it("사용자 목록·상세·상태 변경·soft-delete와 authorization·OpenAPI를 workspace 격리 상태에서 보존한다", async () => {
    const evidence = await assertAdminTargetContract(
      adminIdentityTargetContractInput
    )

    expect(evidence.caseCount).toBe(
      adminIdentityTargetContractInput.cases.length
    )
    expect(readObservation(evidence, "users-unauthenticated")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "UNAUTHORIZED", message: "Unauthorized" },
      },
      effectJournal: [],
      status: 401,
    })
    expect(readObservation(evidence, "users-page")).toMatchObject({
      body: {
        kind: "json",
        value: {
          items: [
            expect.objectContaining({
              id: "user-1",
              name: "학습자",
              status: "active",
            }),
          ],
          pagination: {
            page: 1,
            pageSize: 12,
            totalItems: 1,
            totalPages: 1,
          },
        },
      },
      effectJournal: [
        {
          effect: "identity.read-users",
          input: {
            page: 1,
            pageSize: 12,
            query: "학습",
            sort: "lastActive",
            status: "active",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "users-invalid-page-size")).toMatchObject({
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
    expect(readObservation(evidence, "user-detail")).toMatchObject({
      body: {
        kind: "json",
        value: expect.objectContaining({
          id: "user-1",
          progressPercent: 60,
          totalLessons: 5,
        }),
      },
      effectJournal: [
        {
          effect: "identity.read-user",
          input: { userId: "user-1" },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "missing-user-detail")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "NOT_FOUND", message: "Not Found" },
      },
      status: 404,
    })
    expect(readObservation(evidence, "owner-status-update")).toMatchObject({
      body: {
        kind: "json",
        value: expect.objectContaining({ id: "user-1", status: "suspended" }),
      },
      effectJournal: [
        {
          effect: "identity.update-user-status",
          input: {
            actor: { id: "admin-1", role: "owner" },
            now: "2026-07-18T00:00:00.000Z",
            status: "suspended",
            userId: "user-1",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "owner-delete")).toMatchObject({
      body: { kind: "json", value: { deleted: true } },
      effectJournal: [
        {
          effect: "identity.delete-user",
          input: {
            actor: { id: "admin-1", role: "owner" },
            now: "2026-07-18T00:00:00.000Z",
            userId: "user-1",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(
      readObservation(evidence, "missing-user-status-update")
    ).toMatchObject({
      body: {
        kind: "json",
        value: { code: "NOT_FOUND", message: "Not Found" },
      },
      status: 404,
    })
    for (const id of ["operator-status-update", "operator-delete"] as const) {
      expect(readObservation(evidence, id)).toMatchObject({
        body: {
          kind: "json",
          value: { code: "FORBIDDEN", message: "Forbidden" },
        },
        effectJournal: [],
        status: 403,
      })
    }
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
    throw new Error(`target identity 계약 관찰값을 찾을 수 없습니다: ${id}`)
  }

  return observation
}
