import {
  createWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import {
  createDeletedLearnerPurgeCommand,
  createDeletedLearnerPurgeRepository,
} from "@workspace/identity/module"
import { defaultDeletedLearnerRetentionDays } from "@workspace/identity/ports"
import type { Clock } from "@workspace/kernel/clock"

import { readDeletedLearnerRetentionDays } from "@/config/env"
import { learnerDataPurgePorts } from "@/privacy/learner-data-purge"
import { systemClock } from "@/runtime/system-clock"

export type DeletedLearnerPurgeEnvironment = Readonly<{
  DATABASE_URL?: string
  DELETED_LEARNER_PURGE_APPROVED?: string
  DELETED_LEARNER_PURGE_EXPECTED_DATABASE_URL?: string
}>

export function requireDeletedLearnerPurgeApproval(
  environment: DeletedLearnerPurgeEnvironment
): string {
  if (environment.DATABASE_URL === undefined) {
    throw new Error("삭제 학습자 purge에는 명시적인 DATABASE_URL이 필요합니다.")
  }
  if (environment.DELETED_LEARNER_PURGE_APPROVED !== "true") {
    throw new Error(
      "삭제 학습자 purge에는 DELETED_LEARNER_PURGE_APPROVED=true가 필요합니다."
    )
  }
  if (
    environment.DELETED_LEARNER_PURGE_EXPECTED_DATABASE_URL !==
    environment.DATABASE_URL
  ) {
    throw new Error(
      "삭제 학습자 purge 대상 DATABASE_URL 확인값이 일치하지 않습니다."
    )
  }

  return environment.DATABASE_URL
}

export async function runDeletedLearnerPurge(
  client: WritingAppDatabaseClient,
  clock: Clock = systemClock,
  retentionDays: number = defaultDeletedLearnerRetentionDays
) {
  const command = createDeletedLearnerPurgeCommand({
    clock,
    repository: createDeletedLearnerPurgeRepository({
      database: client.db,
      learnerDataPurges: learnerDataPurgePorts,
    }),
    retentionDays,
  })
  const result = await command.execute()
  if (result.isErr()) {
    throw new Error("삭제 학습자 purge transaction에 실패했습니다.", {
      cause: result.error.cause,
    })
  }

  return result.value
}

if (import.meta.main) {
  const databaseUrl = requireDeletedLearnerPurgeApproval({
    DATABASE_URL: process.env["DATABASE_URL"],
    DELETED_LEARNER_PURGE_APPROVED:
      process.env["DELETED_LEARNER_PURGE_APPROVED"],
    DELETED_LEARNER_PURGE_EXPECTED_DATABASE_URL:
      process.env["DELETED_LEARNER_PURGE_EXPECTED_DATABASE_URL"],
  })
  const client = createWritingAppDatabase(databaseUrl)
  try {
    const result = await runDeletedLearnerPurge(
      client,
      systemClock,
      readDeletedLearnerRetentionDays(
        process.env["LEARNER_DELETION_RETENTION_DAYS"]
      )
    )
    process.stdout.write(
      `${JSON.stringify({
        cutoff: result.cutoff.toISOString(),
        matchedUserCount: result.matchedUserCount,
        purgedUserCount: result.purgedUserCount,
      })}\n`
    )
  } finally {
    client.close()
  }
}
