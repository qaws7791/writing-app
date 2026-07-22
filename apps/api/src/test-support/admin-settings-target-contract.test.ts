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

const adminSettingsTargetContractInput = {
  cases: [
    {
      id: "read-owner",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/settings",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "read-unauthenticated",
      request: { method: "GET", path: "/settings" },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "notice-save-owner",
      request: {
        body: {
          encoding: "utf8",
          value: '{"announce":"공지 내용","banner":"새 강의가 추가되었어요!"}',
        },
        headers: [
          ["Content-Type", "application/json"],
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PUT",
        path: "/settings/notice",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "notice-save-operator",
      request: {
        body: {
          encoding: "utf8",
          value: '{"announce":"공지 내용","banner":"새 강의가 추가되었어요!"}',
        },
        headers: [
          ["Content-Type", "application/json"],
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PUT",
        path: "/settings/notice",
      },
      responseBody: "json",
      scenario: "operator",
    },
    {
      id: "legal-save-owner",
      request: {
        body: {
          encoding: "utf8",
          value: '{"privacy":"개인정보처리방침","terms":"이용약관"}',
        },
        headers: [
          ["Content-Type", "application/json"],
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PUT",
        path: "/settings/legal",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "legal-invalid-body",
      request: {
        body: { encoding: "utf8", value: '{"privacy":1}' },
        headers: [
          ["Content-Type", "application/json"],
          ["Cookie", adminCookie],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "PUT",
        path: "/settings/legal",
      },
      responseBody: "json",
      scenario: "owner",
    },
    {
      id: "openapi-settings",
      openApiProjection: {
        components: [
          {
            names: ["adminSessionCookie"],
            section: "securitySchemes",
          },
        ],
        paths: [
          "/api/admin/settings",
          "/api/admin/settings/legal",
          "/api/admin/settings/notice",
        ],
      },
      request: { method: "GET", path: "/openapi" },
      responseBody: "openapi",
      scenario: "owner",
    },
  ],
  protocolVersion: adminTargetContractProtocolVersion,
  suite: "admin-settings",
} as const satisfies AdminTargetContractRunInput

describe("관리자 Settings delivery의 통합 runtime target 계약", () => {
  it("settings 조회·저장, 권한, validation과 OpenAPI 계약을 보존한다", async () => {
    const evidence = await assertAdminTargetContract(
      adminSettingsTargetContractInput
    )

    expect(evidence.caseCount).toBe(
      adminSettingsTargetContractInput.cases.length
    )
    expect(readObservation(evidence, "read-owner")).toMatchObject({
      body: {
        kind: "json",
        value: {
          legal: { privacy: "개인정보처리방침", terms: "이용약관" },
          notice: {
            announce: "공지 내용",
            banner: "새 강의가 추가되었어요!",
          },
        },
      },
      effectJournal: [{ effect: "settings.read", input: {}, sequence: 1 }],
      status: 200,
    })
    expect(readObservation(evidence, "read-unauthenticated")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "UNAUTHORIZED", message: "Unauthorized" },
      },
      effectJournal: [],
      status: 401,
    })
    expect(readObservation(evidence, "notice-save-owner")).toMatchObject({
      effectJournal: [
        {
          effect: "settings.notice.save",
          input: {
            actor: { id: "admin-1", role: "owner" },
            announce: "공지 내용",
            banner: "새 강의가 추가되었어요!",
            now: "2026-06-14T03:00:00.000Z",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "notice-save-operator")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "FORBIDDEN", message: "Forbidden" },
      },
      effectJournal: [],
      status: 403,
    })
    expect(readObservation(evidence, "legal-invalid-body")).toMatchObject({
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
