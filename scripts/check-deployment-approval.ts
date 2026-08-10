import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { createProductionReadinessVariables } from "#scripts/production-readiness"

const releaseRevision = "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678"
const handoffToken = "0123456789abcdef".repeat(4)
const otherRevision = "f".repeat(40)
const restoreDrillExpiredDays = 32

type ApprovalCase = Readonly<{
  accepted: boolean
  environment?: Readonly<Record<string, string>>
  name: string
  variables: Readonly<Record<string, unknown>>
}>

function toCanonicalTimestamp(value: Date): string {
  return `${value.toISOString().slice(0, 19)}Z`
}

function daysBefore(now: Date, days: number): string {
  return toCanonicalTimestamp(
    new Date(now.getTime() - days * 24 * 60 * 60 * 1_000)
  )
}

function createApprovedVariables(now: Date): Readonly<Record<string, unknown>> {
  return {
    ...createProductionReadinessVariables(
      {
        PRODUCTION_DEPLOY_APPROVED: "true",
        PRODUCTION_FULL_E2E_APPROVED: "true",
        PRODUCTION_LEGAL_REVIEW_APPROVED: "true",
        PRODUCTION_LEGAL_REVIEW_EVIDENCE_ID: "legal-review-01H8Z",
        PRODUCTION_LEGAL_REVIEW_VERIFIED_AT: daysBefore(now, 2),
        PRODUCTION_RESTORE_DRILL_APPROVED: "true",
        PRODUCTION_RESTORE_DRILL_ENVIRONMENT: "staging",
        PRODUCTION_RESTORE_DRILL_EVIDENCE_ID: "restore-drill-01H8Z",
        PRODUCTION_RESTORE_DRILL_VERIFIED_AT: daysBefore(now, 3),
        QUALITY_GATE_RUN_URL:
          "https://github.com/writing-app/writing-app/actions/runs/1234567",
        RELEASE_REVISION: releaseRevision,
      },
      now
    ),
    ansible_become: false,
    writing_app_environment: "production",
    writing_app_hold_operation_lock_for_verify: true,
    writing_app_operation_handoff_token: handoffToken,
    writing_app_source_revision: releaseRevision,
  }
}

function createApprovalCases(now: Date): readonly ApprovalCase[] {
  const approved = createApprovedVariables(now)
  const staging = {
    ...approved,
    writing_app_environment: "staging",
    writing_app_require_production_readiness: false,
  }

  return [
    { accepted: true, name: "완결된 production 증거", variables: approved },
    {
      accepted: true,
      environment: { ADMIN_MCP_SYNTHETIC_BEARER_TOKEN: "" },
      name: "관리자 MCP 비활성 staging 배포",
      variables: { ...staging, writing_app_admin_mcp_enabled: false },
    },
    {
      accepted: true,
      environment: {
        ADMIN_MCP_SYNTHETIC_BEARER_TOKEN: "controller-only-test-token",
      },
      name: "관리자 MCP 활성 staging controller key",
      variables: { ...staging, writing_app_admin_mcp_enabled: true },
    },
    {
      accepted: false,
      environment: { ADMIN_MCP_SYNTHETIC_BEARER_TOKEN: "" },
      name: "관리자 MCP 활성 staging controller key 누락",
      variables: { ...staging, writing_app_admin_mcp_enabled: true },
    },
    ...(
      [
        ["배포 승인 누락", { writing_app_allow_deploy: false }],
        [
          "공개 verify까지 lock 유지 미선언",
          { writing_app_hold_operation_lock_for_verify: false },
        ],
        [
          "전체 E2E 증거 revision 불일치",
          { writing_app_full_e2e_evidence_revision: otherRevision },
        ],
        [
          "placeholder 법률 검토 증거",
          { writing_app_legal_review_evidence_id: "placeholder-01H8Z" },
        ],
        [
          "31일을 넘긴 복구 훈련 증거",
          {
            writing_app_restore_drill_verified_at: daysBefore(
              now,
              restoreDrillExpiredDays
            ),
          },
        ],
        [
          "staging 대상에 production readiness 입력",
          { writing_app_environment: "staging" },
        ],
      ] as const satisfies readonly (readonly [
        string,
        Readonly<Record<string, unknown>>,
      ])[]
    ).map(([name, override]) => ({
      accepted: false,
      name,
      variables: { ...approved, ...override },
    })),
  ]
}

function createLocalInventory(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-app-approval-"))
  const inventory = path.join(root, "inventory.yaml")
  fs.writeFileSync(
    inventory,
    `all:
  children:
    writing_app:
      hosts:
        approval:
          ansible_connection: local
          ansible_python_interpreter: /usr/bin/python3
`
  )
  return inventory
}

function runApprovalCase(
  ansibleRoot: string,
  inventory: string,
  approvalCase: ApprovalCase
): boolean {
  const result = Bun.spawnSync(
    [
      "ansible-playbook",
      "--check",
      "--tags",
      "approval",
      "-i",
      inventory,
      "playbooks/deploy.yaml",
      "--extra-vars",
      JSON.stringify(approvalCase.variables),
    ],
    {
      cwd: ansibleRoot,
      env: {
        ...process.env,
        ADMIN_MCP_SYNTHETIC_BEARER_TOKEN: "",
        ANSIBLE_FORCE_COLOR: "false",
        ANSIBLE_NOCOLOR: "true",
        ...approvalCase.environment,
      },
      stderr: "pipe",
      stdout: "pipe",
    }
  )
  const accepted = result.exitCode === 0
  if (accepted === approvalCase.accepted) return true

  process.stdout.write(result.stdout.toString())
  process.stderr.write(result.stderr.toString())
  console.error(
    approvalCase.accepted
      ? `deploy 승인 gate가 완결된 증거를 거부했습니다: ${approvalCase.name}`
      : `deploy 승인 gate가 통과시켜서는 안 되는 입력을 통과시켰습니다: ${approvalCase.name}`
  )
  return false
}

function runDeploymentApprovalCheck(): void {
  if (process.platform === "win32") {
    console.error(
      "Ansible 배포 승인 검증은 Linux 또는 WSL2 제어 노드에서 실행해야 합니다."
    )
    process.exit(1)
  }

  const ansibleRoot = path.resolve(import.meta.dir, "..", "infra", "ansible")
  const inventory = createLocalInventory()
  const cases = createApprovalCases(new Date())
  const failures = cases.filter(
    (approvalCase) => !runApprovalCase(ansibleRoot, inventory, approvalCase)
  )
  fs.rmSync(path.dirname(inventory), { force: true, recursive: true })

  if (failures.length > 0) process.exit(1)
  const acceptedCount = cases.filter(
    (approvalCase) => approvalCase.accepted
  ).length
  const rejectedCount = cases.length - acceptedCount
  console.log(
    `deploy 승인 gate가 ${acceptedCount}개 완결 입력을 통과시키고 ${rejectedCount}개 불완전 입력을 멈췄습니다.`
  )
}

if (import.meta.main) runDeploymentApprovalCheck()
