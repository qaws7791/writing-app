import { createLocalDatabase } from "@/scripts/local-bindings"
import { type WritingAppDatabaseClient } from "@workspace/db/client"
import {
  createDeletedLearnerPurgeCommand,
  createDeletedLearnerPurgeRepository,
} from "@workspace/identity/module"
import { defaultDeletedLearnerRetentionDays } from "@workspace/identity/ports"
import type { Clock } from "@workspace/kernel/clock"

import { readDeletedLearnerRetentionDays } from "@/config/env"
import { learnerDataPurgePorts } from "@/privacy/learner-data-purge"
import { systemClock } from "@/runtime/system-clock"

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
  const client = await createLocalDatabase()
  try {
    process.stdout.write(
      JSON.stringify(
        await runDeletedLearnerPurge(
          client,
          systemClock,
          readDeletedLearnerRetentionDays(
            process.env["LEARNER_DELETION_RETENTION_DAYS"]
          )
        )
      ) + "\n"
    )
  } finally {
    await client.close()
  }
}
