import fs from "node:fs"
import path from "node:path"

const restoreDrillEvidenceValidityMs = 31 * 24 * 60 * 60 * 1_000
const allowedClockSkewMs = 5 * 60 * 1_000

export interface ProductionReadinessVariables {
  readonly writing_app_allow_deploy: true
  readonly writing_app_full_e2e_approved: true
  readonly writing_app_full_e2e_evidence_revision: string
  readonly writing_app_full_e2e_evidence_run_url: string
  readonly writing_app_legal_review_approved: true
  readonly writing_app_legal_review_evidence_id: string
  readonly writing_app_legal_review_verified_at: string
  readonly writing_app_require_production_readiness: true
  readonly writing_app_restore_drill_approved: true
  readonly writing_app_restore_drill_environment: "staging"
  readonly writing_app_restore_drill_evidence_id: string
  readonly writing_app_restore_drill_verified_at: string
}

export function createProductionReadinessVariables(
  environment: Readonly<Record<string, string | undefined>>,
  now = new Date()
): ProductionReadinessVariables {
  assertValidDate(now, "현재 시각")
  requireApproval(environment, "PRODUCTION_DEPLOY_APPROVED")
  requireApproval(environment, "PRODUCTION_FULL_E2E_APPROVED")
  requireApproval(environment, "PRODUCTION_LEGAL_REVIEW_APPROVED")
  requireApproval(environment, "PRODUCTION_RESTORE_DRILL_APPROVED")

  const sourceRevision = readRevision(environment, "RELEASE_REVISION")
  const qualityGateRunUrl = readQualityGateRunUrl(
    environment,
    "QUALITY_GATE_RUN_URL"
  )
  const legalReviewEvidenceId = readEvidenceId(
    environment,
    "PRODUCTION_LEGAL_REVIEW_EVIDENCE_ID"
  )
  const legalReviewVerifiedAt = readVerifiedTimestamp(
    environment,
    "PRODUCTION_LEGAL_REVIEW_VERIFIED_AT",
    now
  )
  const restoreDrillEnvironment = readRequired(
    environment,
    "PRODUCTION_RESTORE_DRILL_ENVIRONMENT"
  )
  if (restoreDrillEnvironment !== "staging") {
    throw new Error(
      "PRODUCTION_RESTORE_DRILL_ENVIRONMENT는 staging이어야 합니다."
    )
  }
  const restoreDrillEvidenceId = readEvidenceId(
    environment,
    "PRODUCTION_RESTORE_DRILL_EVIDENCE_ID"
  )
  const restoreDrillVerifiedAt = readVerifiedTimestamp(
    environment,
    "PRODUCTION_RESTORE_DRILL_VERIFIED_AT",
    now
  )
  const restoreDrillValidUntil = new Date(
    restoreDrillVerifiedAt.getTime() + restoreDrillEvidenceValidityMs
  )
  if (now.getTime() > restoreDrillValidUntil.getTime()) {
    throw new Error(
      "PRODUCTION_RESTORE_DRILL_VERIFIED_AT 증거는 31일 이내여야 합니다."
    )
  }

  return {
    writing_app_allow_deploy: true,
    writing_app_full_e2e_approved: true,
    writing_app_full_e2e_evidence_revision: sourceRevision,
    writing_app_full_e2e_evidence_run_url: qualityGateRunUrl,
    writing_app_legal_review_approved: true,
    writing_app_legal_review_evidence_id: legalReviewEvidenceId,
    writing_app_legal_review_verified_at: formatCanonicalTimestamp(
      legalReviewVerifiedAt
    ),
    writing_app_require_production_readiness: true,
    writing_app_restore_drill_approved: true,
    writing_app_restore_drill_environment: "staging",
    writing_app_restore_drill_evidence_id: restoreDrillEvidenceId,
    writing_app_restore_drill_verified_at: formatCanonicalTimestamp(
      restoreDrillVerifiedAt
    ),
  }
}

function requireApproval(
  environment: Readonly<Record<string, string | undefined>>,
  name: string
): void {
  if (environment[name] !== "true") {
    throw new Error(`${name}=true 승인이 필요합니다.`)
  }
}

function readRevision(
  environment: Readonly<Record<string, string | undefined>>,
  name: string
): string {
  const value = readRequired(environment, name)
  if (!/^[0-9a-f]{40}$/u.test(value)) {
    throw new Error(`${name}은 40자리 lowercase Git SHA여야 합니다.`)
  }
  return value
}

function readEvidenceId(
  environment: Readonly<Record<string, string | undefined>>,
  name: string
): string {
  const value = readRequired(environment, name)
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._:/-]{7,199}$/u.test(value) ||
    /(?:^|[-_./:])(?:example|none|null|placeholder|tbd|todo|unknown)(?=$|[-_./:])/iu.test(
      value
    )
  ) {
    throw new Error(
      `${name}은 placeholder가 아닌 8..200자 canonical evidence 식별자여야 합니다.`
    )
  }
  return value
}

function readVerifiedTimestamp(
  environment: Readonly<Record<string, string | undefined>>,
  name: string,
  now: Date
): Date {
  const value = readRequired(environment, name)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u.test(value)) {
    throw new Error(`${name}은 UTC ISO 초 단위 시각이어야 합니다.`)
  }
  const parsed = new Date(value)
  assertValidDate(parsed, name)
  if (formatCanonicalTimestamp(parsed) !== value) {
    throw new Error(`${name}은 실제 UTC calendar 시각이어야 합니다.`)
  }
  if (parsed.getTime() > now.getTime() + allowedClockSkewMs) {
    throw new Error(`${name}은 미래 시각일 수 없습니다.`)
  }
  return parsed
}

function readQualityGateRunUrl(
  environment: Readonly<Record<string, string | undefined>>,
  name: string
): string {
  const value = readRequired(environment, name)
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${name}은 유효한 HTTPS Actions run URL이어야 합니다.`)
  }
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    !/^\/[^/]+\/[^/]+\/actions\/runs\/[1-9][0-9]*$/u.test(url.pathname) ||
    `${url.origin}${url.pathname}` !== value
  ) {
    throw new Error(`${name}은 canonical HTTPS Actions run URL이어야 합니다.`)
  }
  return value
}

function readRequired(
  environment: Readonly<Record<string, string | undefined>>,
  name: string
): string {
  const value = environment[name]
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} 환경 변수가 필요합니다.`)
  }
  return value
}

function assertValidDate(value: Date, name: string): void {
  if (!Number.isFinite(value.getTime())) {
    throw new Error(`${name}이 유효하지 않습니다.`)
  }
}

function formatCanonicalTimestamp(value: Date): string {
  return value.toISOString().replace(".000Z", "Z")
}

function runProductionReadinessCheck(): void {
  const outputPath = readRequired(process.env, "PRODUCTION_READINESS_OUTPUT")
  const variables = createProductionReadinessVariables(process.env)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(variables, null, 2)}\n`)
  console.log(
    "Production 법률 검토, staging 복구 훈련과 전체 E2E 증거를 확인했습니다."
  )
}

if (import.meta.main) {
  try {
    runProductionReadinessCheck()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
