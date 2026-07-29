import {
  createWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { createDeletedLearnerPurgeCommand } from "@workspace/identity/purge"
import type { Clock } from "@workspace/kernel/clock"

import { createDeletedLearnerPurgeRepository } from "@/adapters/identity/deleted-learner-purge-repository"
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
  clock: Clock = systemClock
) {
  const command = createDeletedLearnerPurgeCommand({
    clock,
    repository: createDeletedLearnerPurgeRepository(client.db),
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
    const result = await runDeletedLearnerPurge(client)
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
