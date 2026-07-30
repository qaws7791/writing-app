import { describe, expect, test } from "bun:test"

import { createProductionReadinessVariables } from "#scripts/production-readiness"

const now = new Date("2026-07-24T12:00:00Z")
const revision = "a".repeat(40)
const validEnvironment = {
  PRODUCTION_DEPLOY_APPROVED: "true",
  PRODUCTION_FULL_E2E_APPROVED: "true",
  PRODUCTION_LEGAL_REVIEW_APPROVED: "true",
  PRODUCTION_LEGAL_REVIEW_EVIDENCE_ID: "LEGAL-2026-0042",
  PRODUCTION_LEGAL_REVIEW_VERIFIED_AT: "2026-07-20T09:30:00Z",
  PRODUCTION_RESTORE_DRILL_APPROVED: "true",
  PRODUCTION_RESTORE_DRILL_ENVIRONMENT: "staging",
  PRODUCTION_RESTORE_DRILL_EVIDENCE_ID: "RESTORE-2026-07-001",
  PRODUCTION_RESTORE_DRILL_VERIFIED_AT: "2026-07-01T03:15:00Z",
  QUALITY_GATE_RUN_URL:
    "https://github.com/acme/writing-app/actions/runs/123456789",
  RELEASE_REVISION: revision,
} as const

describe("production readiness", () => {
  test("법률 검토, 최근 staging 복구와 동일 revision 전체 E2E를 Ansible 변수로 만든다", () => {
    expect(createProductionReadinessVariables(validEnvironment, now)).toEqual({
      writing_app_allow_deploy: true,
      writing_app_full_e2e_approved: true,
      writing_app_full_e2e_evidence_revision: revision,
      writing_app_full_e2e_evidence_run_url:
        validEnvironment.QUALITY_GATE_RUN_URL,
      writing_app_legal_review_approved: true,
      writing_app_legal_review_evidence_id: "LEGAL-2026-0042",
      writing_app_legal_review_verified_at: "2026-07-20T09:30:00Z",
      writing_app_require_production_readiness: true,
      writing_app_restore_drill_approved: true,
      writing_app_restore_drill_environment: "staging",
      writing_app_restore_drill_evidence_id: "RESTORE-2026-07-001",
      writing_app_restore_drill_verified_at: "2026-07-01T03:15:00Z",
    })
  })

  test.each([
    "PRODUCTION_DEPLOY_APPROVED",
    "PRODUCTION_FULL_E2E_APPROVED",
    "PRODUCTION_LEGAL_REVIEW_APPROVED",
    "PRODUCTION_RESTORE_DRILL_APPROVED",
  ])("%s가 exact true가 아니면 fail-closed한다", (name) => {
    expect(() =>
      createProductionReadinessVariables(
        { ...validEnvironment, [name]: "false" },
        now
      )
    ).toThrow(`${name}=true`)
  })

  test.each([
    "TODO-review",
    "LEGAL-TODO-123",
    "https://example.com/review",
    "RESTORE/placeholder/1",
  ])("placeholder evidence %s를 거부한다", (evidenceId) => {
    expect(() =>
      createProductionReadinessVariables(
        {
          ...validEnvironment,
          PRODUCTION_LEGAL_REVIEW_EVIDENCE_ID: evidenceId,
        },
        now
      )
    ).toThrow("placeholder")
  })

  test("production 환경에서 수행한 복구 훈련 증거를 거부한다", () => {
    expect(() =>
      createProductionReadinessVariables(
        {
          ...validEnvironment,
          PRODUCTION_RESTORE_DRILL_ENVIRONMENT: "production",
        },
        now
      )
    ).toThrow("staging이어야")
  })

  test("31일을 넘었거나 미래인 restore 증거를 거부한다", () => {
    expect(() =>
      createProductionReadinessVariables(
        {
          ...validEnvironment,
          PRODUCTION_RESTORE_DRILL_VERIFIED_AT: "2026-06-01T00:00:00Z",
        },
        now
      )
    ).toThrow("31일 이내")
    expect(() =>
      createProductionReadinessVariables(
        {
          ...validEnvironment,
          PRODUCTION_RESTORE_DRILL_VERIFIED_AT: "2026-07-24T12:06:00Z",
        },
        now
      )
    ).toThrow("미래 시각")
  })

  test("workflow_run의 canonical URL과 source revision이 아니면 거부한다", () => {
    expect(() =>
      createProductionReadinessVariables(
        {
          ...validEnvironment,
          QUALITY_GATE_RUN_URL: "https://github.com/acme/writing-app/pull/1",
        },
        now
      )
    ).toThrow("Actions run URL")
    expect(() =>
      createProductionReadinessVariables(
        { ...validEnvironment, RELEASE_REVISION: "main" },
        now
      )
    ).toThrow("40자리 lowercase Git SHA")
  })
})
