import {
  createWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import type { LearnerDeletionMarkerStorePort } from "@workspace/identity/ports"
import { createR2PrivateObjectStorage } from "@workspace/storage/r2-object-storage"
import { createLocalBindings } from "@/scripts/local-bindings"
import { z } from "zod"

import { createDeletionMarkerStore } from "@/adapters/identity/deletion-marker-store"
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

export async function runDeletionMarkerReapplication(input: {
  readonly client: WritingAppDatabaseClient
  readonly markerStore: Pick<LearnerDeletionMarkerStorePort, "readAll">
  readonly options: ReapplyDeletionMarkersOptions
  readonly retentionDays: number
}) {
  const reapplication = createDeletionMarkerReapplication({
    clock: systemClock,
    database: input.client.db,
    markerStore: input.markerStore,
    retentionDays: input.retentionDays,
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

if (import.meta.main) {
  const options = parseReapplyDeletionMarkersArguments(process.argv.slice(2))
  const proxy = await createLocalBindings()
  try {
    const environment = parseApiEnv(
      Object.fromEntries(
        Object.entries(proxy.env).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string"
        )
      )
    )
    const markerStore = createDeletionMarkerStore({
      idGenerator: uuidGenerator,
      objectStorage: createR2PrivateObjectStorage(proxy.env.PRIVATE_DATA),
      prefix: "privacy/deletion-markers",
    })
    const client = createWritingAppDatabase(proxy.env.DB)
    process.stdout.write(
      JSON.stringify(
        await runDeletionMarkerReapplication({
          client,
          markerStore,
          options,
          retentionDays: environment.deletedLearnerRetentionDays,
        })
      ) + "\n"
    )
  } finally {
    await proxy.dispose()
  }
}
