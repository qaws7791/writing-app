import { describe, expect, test } from "bun:test"
import path from "node:path"

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

  test("모든 명시적 승인은 exact true가 아니면 fail-closed한다", () => {
    for (const name of [
      "PRODUCTION_DEPLOY_APPROVED",
      "PRODUCTION_FULL_E2E_APPROVED",
      "PRODUCTION_LEGAL_REVIEW_APPROVED",
      "PRODUCTION_RESTORE_DRILL_APPROVED",
    ] as const) {
      expect(() =>
        createProductionReadinessVariables(
          { ...validEnvironment, [name]: "false" },
          now
        )
      ).toThrow(`${name}=true`)
    }
  })

  test("placeholder evidence와 production 복구 훈련을 거부한다", () => {
    for (const evidenceId of [
      "TODO-review",
      "LEGAL-TODO-123",
      "https://example.com/review",
      "RESTORE/placeholder/1",
    ]) {
      expect(() =>
        createProductionReadinessVariables(
          {
            ...validEnvironment,
            PRODUCTION_LEGAL_REVIEW_EVIDENCE_ID: evidenceId,
          },
          now
        )
      ).toThrow("placeholder")
    }
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

  test("Ansible도 호스트 변경 전에 동일 revision과 유효 기간을 재검증한다", async () => {
    const playbook = Bun.YAML.parse(
      await Bun.file(
        path.resolve(
          import.meta.dir,
          "..",
          "infra",
          "ansible",
          "playbooks",
          "deploy.yaml"
        )
      ).text()
    ) as readonly AnsiblePlay[]
    const tasks = playbook[0]?.tasks ?? []
    const evidenceGateIndex = tasks.findIndex((task) =>
      isStringArray(task["ansible.builtin.assert"]?.that)
        ? task["ansible.builtin.assert"].that.includes(
            "writing_app_full_e2e_evidence_revision == writing_app_source_revision"
          )
        : false
    )
    const operationLockIndex = tasks.findIndex((task) =>
      isStringArray(task["ansible.builtin.command"]?.argv)
        ? task["ansible.builtin.command"].argv.includes(
            "{{ writing_app_operation_lock_directory }}"
          )
        : false
    )

    expect(evidenceGateIndex).toBeGreaterThanOrEqual(0)
    expect(evidenceGateIndex).toBeLessThan(operationLockIndex)
    const evidenceGate = tasks[evidenceGateIndex]
    if (evidenceGate === undefined) {
      throw new Error("Production evidence gate를 찾지 못했습니다.")
    }
    const conditions = readStringArray(
      evidenceGate["ansible.builtin.assert"]?.that,
      "Production evidence gate 조건"
    )

    expect(conditions).toContain(
      "writing_app_full_e2e_evidence_revision == writing_app_source_revision"
    )
    expect(conditions).toContain("writing_app_environment == 'production'")
    expect(
      conditions.some(
        (condition) =>
          condition.includes("writing_app_legal_review_verified_at") &&
          condition.includes("to_datetime(") &&
          condition.includes("total_seconds() >= 0")
      )
    ).toBe(true)
    expect(
      conditions.some(
        (condition) =>
          condition.includes("writing_app_restore_drill_verified_at") &&
          condition.includes("to_datetime(") &&
          condition.includes("total_seconds() >= 0")
      )
    ).toBe(true)
    expect(
      conditions.some(
        (condition) =>
          condition.includes("writing_app_restore_drill_verified_at") &&
          condition.includes("total_seconds() <= 2678400")
      )
    ).toBe(true)
    for (const evidenceId of [
      "writing_app_legal_review_evidence_id",
      "writing_app_restore_drill_evidence_id",
    ]) {
      expect(
        conditions.some(
          (condition) =>
            condition.includes(evidenceId) &&
            condition.includes("search(") &&
            condition.includes("placeholder")
        )
      ).toBe(true)
    }
    expect(evidenceGate.when).toBe(
      "(writing_app_environment == 'production') or (writing_app_require_production_readiness | default(false) | bool)"
    )
  })
})

type AnsiblePlay = {
  readonly tasks?: readonly AnsibleTask[]
}

type AnsibleTask = {
  readonly "ansible.builtin.assert"?: {
    readonly that?: unknown
  }
  readonly "ansible.builtin.command"?: {
    readonly argv?: unknown
  }
  readonly when?: unknown
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function readStringArray(value: unknown, label: string): readonly string[] {
  if (!isStringArray(value)) {
    throw new Error(`${label}이 문자열 배열이 아닙니다.`)
  }
  return value
}
