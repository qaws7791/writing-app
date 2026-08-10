import { describe, expect, test } from "bun:test"

import { createProductionReadinessVariables } from "#scripts/production-readiness"

const fixedNowMs = Date.parse("2026-07-24T12:00:00Z")
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
  RELEASE_REVISION: "a".repeat(40),
} as const

describe("production readiness", () => {
  test.each([
    "PRODUCTION_DEPLOY_APPROVED",
    "PRODUCTION_FULL_E2E_APPROVED",
    "PRODUCTION_LEGAL_REVIEW_APPROVED",
    "PRODUCTION_RESTORE_DRILL_APPROVED",
  ])("%s가 exact true가 아니면 fail-closed한다", (name) => {
    expect(() =>
      createProductionReadinessVariables(
        { ...validEnvironment, [name]: "false" },
        new Date(fixedNowMs)
      )
    ).toThrow(`${name}=true`)
  })

  test("31일보다 1ms 오래된 restore 증거를 거부한다", () => {
    expect(() =>
      createProductionReadinessVariables(
        {
          ...validEnvironment,
          PRODUCTION_RESTORE_DRILL_VERIFIED_AT: "2026-06-23T12:00:00Z",
        },
        new Date(fixedNowMs + 1)
      )
    ).toThrow("31일 이내")
  })
})
