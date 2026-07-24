import {
  createWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import type { LearnerDeletionMarkerStorePort } from "@workspace/identity/ports"
import { createS3PrivateObjectStorage } from "@workspace/storage/private-object-storage"
import { z } from "zod"

import { createS3DeletionMarkerStore } from "@/adapters/identity/deletion-marker-store"
import { parseApiEnv } from "@/config/env"
import {
  createDeletionMarkerReapplication,
  type DeletionMarkerReapplicationError,
} from "@/privacy/deletion-marker-reapplication"
import { systemClock } from "@/runtime/system-clock"
import { uuidGenerator } from "@/runtime/uuid-generator"

export type ReapplyDeletionMarkersOptions = Readonly<{
  batchSize: number
  dryRun: boolean
  snapshotAt: Date
}>

export type ReapplyDeletionMarkersEnvironment = Readonly<{
  DATABASE_URL?: string
  DELETION_RESTORE_APPROVED?: string
  DELETION_RESTORE_ENVIRONMENT?: string
  DELETION_RESTORE_EXPECTED_DATABASE_URL?: string
  DEPLOYMENT_ENVIRONMENT?: string
}>

export class DeletionMarkerReapplicationExecutionError extends Error {
  readonly snapshotAt: Date
  readonly stage: DeletionMarkerReapplicationError["stage"]

  constructor(input: {
    readonly error: DeletionMarkerReapplicationError
    readonly snapshotAt: Date
  }) {
    super(`삭제 marker 재적용 ${input.error.stage} 단계에 실패했습니다.`)
    this.name = "DeletionMarkerReapplicationExecutionError"
    this.snapshotAt = new Date(input.snapshotAt)
    this.stage = input.error.stage
  }
}

export function parseReapplyDeletionMarkersArguments(
  arguments_: readonly string[]
): ReapplyDeletionMarkersOptions {
  let batchSize = 100
  let dryRun = false
  let snapshotAt: Date | undefined

  for (const argument of arguments_) {
    if (argument === "--dry-run") {
      dryRun = true
      continue
    }
    if (argument.startsWith("--batch-size=")) {
      batchSize = Number(argument.slice("--batch-size=".length))
      continue
    }
    if (argument.startsWith("--snapshot-at=")) {
      const value = argument.slice("--snapshot-at=".length)
      if (!z.iso.datetime({ offset: true }).safeParse(value).success) {
        throw new Error(
          "restore snapshot의 --snapshot-at은 timezone을 포함한 ISO datetime이어야 합니다."
        )
      }
      snapshotAt = new Date(value)
      continue
    }
    throw new Error(`지원하지 않는 deletion restore 인자입니다: ${argument}`)
  }

  if (snapshotAt === undefined || !Number.isFinite(snapshotAt.getTime())) {
    throw new Error("restore snapshot의 정확한 --snapshot-at이 필요합니다.")
  }
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1_000) {
    throw new Error("batch size는 1 이상 1000 이하여야 합니다.")
  }

  return { batchSize, dryRun, snapshotAt }
}

export function requireReapplyDeletionMarkersApproval(
  environment: ReapplyDeletionMarkersEnvironment,
  options: ReapplyDeletionMarkersOptions
): string {
  const databaseUrl = environment.DATABASE_URL
  if (databaseUrl === undefined) {
    throw new Error(
      "삭제 marker 재적용에는 명시적인 DATABASE_URL이 필요합니다."
    )
  }
  if (
    environment.DELETION_RESTORE_ENVIRONMENT === undefined ||
    environment.DELETION_RESTORE_ENVIRONMENT !==
      environment.DEPLOYMENT_ENVIRONMENT
  ) {
    throw new Error(
      "DELETION_RESTORE_ENVIRONMENT는 DEPLOYMENT_ENVIRONMENT와 명시적으로 일치해야 합니다."
    )
  }
  if (environment.DELETION_RESTORE_EXPECTED_DATABASE_URL !== databaseUrl) {
    throw new Error(
      "DELETION_RESTORE_EXPECTED_DATABASE_URL이 대상 DATABASE_URL과 일치하지 않습니다."
    )
  }
  if (!options.dryRun && environment.DELETION_RESTORE_APPROVED !== "true") {
    throw new Error(
      "실제 삭제 marker 재적용에는 DELETION_RESTORE_APPROVED=true가 필요합니다."
    )
  }
  return databaseUrl
}

export async function runDeletionMarkerReapplication(input: {
  readonly client: WritingAppDatabaseClient
  readonly markerStore: Pick<LearnerDeletionMarkerStorePort, "readAll">
  readonly options: ReapplyDeletionMarkersOptions
}) {
  const reapplication = createDeletionMarkerReapplication({
    clock: systemClock,
    database: input.client.db,
    markerStore: input.markerStore,
  })
  const result = await reapplication.execute(input.options)
  if (result.isErr()) {
    throw new DeletionMarkerReapplicationExecutionError({
      error: result.error,
      snapshotAt: input.options.snapshotAt,
    })
  }
  return result.value
}

async function main(): Promise<void> {
  const options = parseReapplyDeletionMarkersArguments(process.argv.slice(2))
  const databaseUrl = requireReapplyDeletionMarkersApproval(
    {
      DATABASE_URL: process.env["DATABASE_URL"],
      DELETION_RESTORE_APPROVED: process.env["DELETION_RESTORE_APPROVED"],
      DELETION_RESTORE_ENVIRONMENT: process.env["DELETION_RESTORE_ENVIRONMENT"],
      DELETION_RESTORE_EXPECTED_DATABASE_URL:
        process.env["DELETION_RESTORE_EXPECTED_DATABASE_URL"],
      DEPLOYMENT_ENVIRONMENT: process.env["DEPLOYMENT_ENVIRONMENT"],
    },
    options
  )
  const environment = parseApiEnv(process.env)
  if (environment.deletionMarkerStore === undefined) {
    throw new Error("private 삭제 marker 저장소 설정이 필요합니다.")
  }
  const objectStorage = createS3PrivateObjectStorage(
    environment.deletionMarkerStore
  )
  if (objectStorage.isErr()) {
    throw new Error("private 삭제 marker 저장소 설정이 올바르지 않습니다.")
  }
  const markerStore = createS3DeletionMarkerStore({
    idGenerator: uuidGenerator,
    objectStorage: objectStorage.value,
    prefix: environment.deletionMarkerStore.prefix,
  })
  const client = createWritingAppDatabase(databaseUrl)
  try {
    const result = await runDeletionMarkerReapplication({
      client,
      markerStore,
      options,
    })
    process.stdout.write(
      `${JSON.stringify({
        kind: "deletion-marker-reapplication-result",
        ...result,
      })}\n`
    )
  } finally {
    client.close()
  }
}

if (import.meta.main) {
  await main().catch((error: unknown) => {
    process.stderr.write(
      `${JSON.stringify({
        kind: "deletion-marker-reapplication-failed",
        message:
          error instanceof Error
            ? error.message
            : "삭제 marker 재적용에 실패했습니다.",
        ...(error instanceof DeletionMarkerReapplicationExecutionError
          ? {
              snapshotAt: error.snapshotAt.toISOString(),
              stage: error.stage,
            }
          : {}),
      })}\n`
    )
    process.exitCode = 1
  })
}
