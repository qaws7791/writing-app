import { readFile } from "node:fs/promises"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import {
  createDeletedLearnerPurgeCommand,
  createDeletedLearnerPurgeRepository,
} from "@workspace/identity/module"
import { createOperationsModule } from "@workspace/operations/module"
import { logEventNames } from "@workspace/observability/events"
import type { ContentAssetId, CourseId } from "@workspace/types/ids"

import { composeAiFeedbackModule } from "@/composition/ai-feedback-module.composition"
import { composeContentModule } from "@/composition/content-module.composition"
import { parseApiEnv } from "@/config/env"
import {
  createDailyMaintenance,
  type DailyMaintenanceError,
} from "@/maintenance/daily-maintenance"
import { createExpiredSessionMaintenance } from "@/maintenance/expired-session-maintenance"
import { learnerDataPurgePorts } from "@/privacy/learner-data-purge"
import {
  parseExternalLogRetentionEvidence,
  type ExternalLogRetentionEvidence,
} from "@/maintenance/log-retention-evidence"
import { systemClock } from "@/runtime/system-clock"
import {
  createPrefixedIdGenerator,
  uuidGenerator,
} from "@/runtime/uuid-generator"

export type DailyMaintenanceEnvironment = Readonly<{
  DAILY_MAINTENANCE_APPROVED?: string
  DAILY_MAINTENANCE_ENVIRONMENT?: string
  DAILY_MAINTENANCE_EXPECTED_DATABASE_URL?: string
  DATABASE_URL?: string
  DEPLOYMENT_ENVIRONMENT?: string
  MAINTENANCE_LOG_RETENTION_EVIDENCE_FILE?: string
}>

export type DailyMaintenanceCliOptions = Readonly<{
  batchSize: number
  dryRun: boolean
}>

export class DailyMaintenanceExecutionError extends Error {
  readonly cutoff: Date
  readonly stage: DailyMaintenanceError["stage"]

  constructor(error: DailyMaintenanceError) {
    super(`daily maintenance ${error.stage} batch에 실패했습니다.`, {
      cause: error.cause,
    })
    this.name = "DailyMaintenanceExecutionError"
    this.cutoff = new Date(error.cutoff)
    this.stage = error.stage
  }
}

export function parseDailyMaintenanceArguments(
  arguments_: readonly string[]
): DailyMaintenanceCliOptions {
  let batchSize = 100
  let dryRun = false

  for (const argument of arguments_) {
    if (argument === "--dry-run") {
      dryRun = true
      continue
    }
    if (argument.startsWith("--batch-size=")) {
      batchSize = Number(argument.slice("--batch-size=".length))
      continue
    }
    throw new Error(`지원하지 않는 maintenance 인자입니다: ${argument}`)
  }
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1_000) {
    throw new Error("batch size는 1 이상 1000 이하여야 합니다.")
  }

  return { batchSize, dryRun }
}

export function requireDailyMaintenanceApproval(
  environment: DailyMaintenanceEnvironment,
  options: DailyMaintenanceCliOptions
) {
  const databaseUrl = environment.DATABASE_URL
  if (databaseUrl === undefined) {
    throw new Error("daily maintenance에는 명시적인 DATABASE_URL이 필요합니다.")
  }
  if (
    environment.DAILY_MAINTENANCE_ENVIRONMENT === undefined ||
    environment.DAILY_MAINTENANCE_ENVIRONMENT !==
      environment.DEPLOYMENT_ENVIRONMENT
  ) {
    throw new Error(
      "DAILY_MAINTENANCE_ENVIRONMENT는 DEPLOYMENT_ENVIRONMENT와 명시적으로 일치해야 합니다."
    )
  }
  if (environment.DAILY_MAINTENANCE_EXPECTED_DATABASE_URL !== databaseUrl) {
    throw new Error(
      "DAILY_MAINTENANCE_EXPECTED_DATABASE_URL이 대상 DATABASE_URL과 일치하지 않습니다."
    )
  }
  if (!options.dryRun && environment.DAILY_MAINTENANCE_APPROVED !== "true") {
    throw new Error(
      "실제 daily maintenance에는 DAILY_MAINTENANCE_APPROVED=true가 필요합니다."
    )
  }
  if (
    environment.DEPLOYMENT_ENVIRONMENT === "production" &&
    !options.dryRun &&
    environment.MAINTENANCE_LOG_RETENTION_EVIDENCE_FILE === undefined
  ) {
    throw new Error(
      "production daily maintenance에는 외부 log retention 증거 파일이 필요합니다."
    )
  }

  return {
    databaseUrl,
    logRetentionEvidenceFile:
      environment.MAINTENANCE_LOG_RETENTION_EVIDENCE_FILE ?? null,
  }
}

export async function runDailyMaintenance(input: {
  readonly client: WritingAppDatabaseClient
  readonly environment: ReturnType<typeof parseApiEnv>
  readonly externalLogRetentionEvidence: ExternalLogRetentionEvidence | null
  readonly options: DailyMaintenanceCliOptions
  readonly reportingClient: WritingAppDatabaseClient
}) {
  const content = composeContentModule({
    assetIdGenerator: createPrefixedIdGenerator<ContentAssetId>(
      "content-asset-",
      uuidGenerator
    ),
    assetStore: input.environment.adminAssetStore,
    clock: systemClock,
    courseIdGenerator: createPrefixedIdGenerator<CourseId>(
      "course-",
      uuidGenerator
    ),
    database: input.client.db,
  })
  const operations = createOperationsModule({
    audit: {
      failureObserver(event) {
        process.stderr.write(
          `${JSON.stringify({
            kind: logEventNames.auditPersistenceFailed,
            message: readFailureMessage(event.cause),
            operation: event.operation,
          })}\n`
        )
      },
      idGenerator: uuidGenerator,
    },
    clock: systemClock,
    database: input.client.db,
    reportingDatabase: input.reportingClient.sqlite,
    reportingFailureObserver() {
      // 유지보수 경로는 리포팅을 조회하지 않는다.
    },
  })
  const aiFeedback = composeAiFeedbackModule({
    attemptIdGenerator: uuidGenerator,
    attemptPolicy: input.environment.aiFeedback.attemptPolicy,
    clock: systemClock,
    dailyQuotaPolicy: input.environment.aiFeedback.dailyQuotaPolicy,
    database: input.client.db,
    openAi: {
      apiKey: input.environment.openAiApiKey,
      model: input.environment.openAiModel,
    },
  })
  const maintenance = createDailyMaintenance({
    aiFeedback: aiFeedback.maintenance,
    auditTrail: operations.auditTrail,
    clock: systemClock,
    contentAssets: content.maintenance,
    deletedLearners: createDeletedLearnerPurgeCommand({
      clock: systemClock,
      repository: createDeletedLearnerPurgeRepository({
        database: input.client.db,
        learnerDataPurges: learnerDataPurgePorts,
      }),
    }),
    expiredSessions: createExpiredSessionMaintenance(input.client.db),
    externalLogRetentionEvidence: input.externalLogRetentionEvidence,
  })
  const result = await maintenance.execute(input.options)
  if (result.isErr()) {
    throw new DailyMaintenanceExecutionError(result.error)
  }
  return result.value
}

function readFailureMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

async function readLogRetentionEvidence(
  path: string | null
): Promise<ExternalLogRetentionEvidence | null> {
  if (path === null) return null
  const value: unknown = JSON.parse(await readFile(path, "utf8"))
  return parseExternalLogRetentionEvidence(value, systemClock.now())
}

async function main(): Promise<void> {
  const options = parseDailyMaintenanceArguments(process.argv.slice(2))
  const approval = requireDailyMaintenanceApproval(
    {
      DAILY_MAINTENANCE_APPROVED: process.env["DAILY_MAINTENANCE_APPROVED"],
      DAILY_MAINTENANCE_ENVIRONMENT:
        process.env["DAILY_MAINTENANCE_ENVIRONMENT"],
      DAILY_MAINTENANCE_EXPECTED_DATABASE_URL:
        process.env["DAILY_MAINTENANCE_EXPECTED_DATABASE_URL"],
      DATABASE_URL: process.env["DATABASE_URL"],
      DEPLOYMENT_ENVIRONMENT: process.env["DEPLOYMENT_ENVIRONMENT"],
      MAINTENANCE_LOG_RETENTION_EVIDENCE_FILE:
        process.env["MAINTENANCE_LOG_RETENTION_EVIDENCE_FILE"],
    },
    options
  )
  const environment = parseApiEnv(process.env)
  const externalLogRetentionEvidence = await readLogRetentionEvidence(
    approval.logRetentionEvidenceFile
  )
  const client = createWritingAppDatabase(approval.databaseUrl)
  const reportingClient = createReadOnlyWritingAppDatabase(approval.databaseUrl)
  try {
    const result = await runDailyMaintenance({
      client,
      environment,
      externalLogRetentionEvidence,
      options,
      reportingClient,
    })
    process.stdout.write(
      `${JSON.stringify({ kind: "daily-maintenance-result", ...result })}\n`
    )
  } finally {
    reportingClient.close()
    client.close()
  }
}

if (import.meta.main) {
  await main().catch((error: unknown) => {
    process.stderr.write(
      `${JSON.stringify({
        ...(error instanceof DailyMaintenanceExecutionError
          ? {
              cutoff: Number.isFinite(error.cutoff.getTime())
                ? error.cutoff.toISOString()
                : null,
              stage: error.stage,
            }
          : {}),
        kind: "daily-maintenance-failed",
        message:
          error instanceof Error
            ? error.message
            : "daily maintenance에 실패했습니다.",
      })}\n`
    )
    process.exitCode = 1
  })
}
