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

const adminFoundationTargetContractInput = {
  cases: [
    {
      id: "health",
      request: { method: "GET", path: "/health" },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "session-unauthenticated",
      request: { method: "GET", path: "/session" },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "session-cookie-authenticated",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/session",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "session-bearer-only",
      request: {
        headers: [["Authorization", "Bearer admin-token"]],
        method: "GET",
        path: "/session",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "cors-preflight",
      request: {
        headers: [
          ["Access-Control-Request-Headers", "Authorization, Content-Type"],
          ["Access-Control-Request-Method", "PUT"],
          ["Origin", adminOrigin],
        ],
        method: "OPTIONS",
        path: "/session",
      },
      responseBody: "none",
      scenario: "default",
    },
    {
      id: "untrusted-password-change",
      request: {
        body: {
          encoding: "utf8",
          value:
            '{"currentPassword":"old-password","newPassword":"new-password","revokeOtherSessions":false}',
        },
        headers: [
          ["Cookie", adminCookie],
          ["Content-Type", "application/json"],
          ["Origin", "https://attacker.example.test"],
          ["Sec-Fetch-Site", "same-site"],
        ],
        method: "POST",
        path: "/auth/change-password",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "password-change-revocation",
      request: {
        body: {
          encoding: "utf8",
          value:
            '{"currentPassword":"old-password","newPassword":"new-password","revokeOtherSessions":false}',
        },
        headers: [
          ["Cookie", adminCookie],
          ["Content-Type", "application/json"],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/auth/change-password",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "body-limit",
      request: {
        body: { encoding: "utf8", value: "x" },
        headers: [
          ["Content-Length", String(6 * 1024 * 1024 + 1)],
          ["Content-Type", "text/plain"],
        ],
        method: "POST",
        path: "/auth/body-limit",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "owner-action",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/target-contract-owner-action",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "operator-owner-action",
      request: {
        headers: [
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/target-contract-owner-action",
      },
      responseBody: "json",
      scenario: "operator",
    },
    {
      id: "anonymous-owner-action",
      request: {
        headers: [["Origin", adminOrigin]],
        method: "POST",
        path: "/target-contract-owner-action",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "auth-handler-error-redaction",
      request: { method: "GET", path: "/auth/failure" },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "openapi-common-foundation",
      openApiProjection: {
        components: [
          {
            names: ["adminSessionCookie"],
            section: "securitySchemes",
          },
        ],
        paths: [
          "/api/admin/health",
          "/api/admin/target-contract-owner-action",
          "/api/admin/session",
        ],
      },
      request: { method: "GET", path: "/openapi" },
      responseBody: "openapi",
      scenario: "default",
    },
  ],
  protocolVersion: adminTargetContractProtocolVersion,
  suite: "admin-foundation",
} as const satisfies AdminTargetContractRunInput

describe("관리자 공통 delivery의 통합 runtime target 계약", () => {
  it("auth/session, CORS, body limit, 권한, OpenAPI와 부수 효과를 workspace 격리 상태에서 보존한다", async () => {
    const evidence = await assertAdminTargetContract(
      adminFoundationTargetContractInput
    )

    expect(evidence.caseCount).toBe(
      adminFoundationTargetContractInput.cases.length
    )
    expect(readObservation(evidence, "health")).toMatchObject({
      body: {
        kind: "json",
        value: { ok: true, service: "api" },
      },
      status: 200,
    })
    expect(
      readObservation(evidence, "session-cookie-authenticated")
    ).toMatchObject({
      body: {
        kind: "json",
        value: {
          admin: {
            email: "admin@example.com",
            id: "admin-1",
            name: "관리자",
            role: "owner",
          },
        },
      },
      headers: {
        "cache-control": ["private, no-store"],
      },
      status: 200,
    })
    expect(readObservation(evidence, "session-bearer-only")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "UNAUTHORIZED", message: "Unauthorized" },
      },
      status: 401,
    })
    expect(
      readObservation(evidence, "untrusted-password-change")
    ).toMatchObject({
      body: {
        kind: "json",
        value: { code: "FORBIDDEN_ORIGIN", message: "Forbidden" },
      },
      effectJournal: expect.not.arrayContaining([
        expect.objectContaining({ effect: "auth.handler" }),
      ]),
      status: 403,
    })
    expect(
      readObservation(evidence, "password-change-revocation")
    ).toMatchObject({
      effectJournal: expect.arrayContaining([
        {
          effect: "auth.handler",
          input: {
            body: {
              currentPassword: "old-password",
              newPassword: "new-password",
              revokeOtherSessions: true,
            },
            method: "POST",
            path: "/auth/change-password",
          },
          sequence: 1,
        },
      ]),
      status: 200,
    })
    expect(readObservation(evidence, "body-limit")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "PAYLOAD_TOO_LARGE", message: "Payload Too Large" },
      },
      effectJournal: expect.not.arrayContaining([
        expect.objectContaining({ effect: "auth.handler" }),
      ]),
      status: 413,
    })
    expect(readObservation(evidence, "owner-action")).toMatchObject({
      effectJournal: expect.arrayContaining([
        expect.objectContaining({
          effect: "security.audit",
          input: expect.objectContaining({
            action: "owner.mutation",
            actorId: "admin-1",
            outcome: "succeeded",
          }),
        }),
      ]),
      status: 200,
    })
    expect(readObservation(evidence, "operator-owner-action")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "FORBIDDEN", message: "Forbidden" },
      },
      status: 403,
    })
    expect(
      readObservation(evidence, "auth-handler-error-redaction")
    ).toMatchObject({
      body: {
        kind: "json",
        value: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        },
      },
      status: 500,
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
