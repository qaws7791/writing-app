import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { WritingId } from "@workspace/types/ids"

import { createWritingApplication } from "#writing/application/writing-application"
import type { WritingApplication } from "#writing/application/ports/writing-ports"
import { createDrizzleWritingRepository } from "#writing/infrastructure/persistence/writing-drizzle-repository"

export type WritingModule = Readonly<{
  application: WritingApplication
}>

export function createWritingModule(input: {
  readonly clock: Clock
  readonly database: WritingAppDatabase
  readonly idGenerator: IdGenerator<WritingId>
}): WritingModule {
  return {
    application: createWritingApplication({
      clock: input.clock,
      idGenerator: input.idGenerator,
      repository: createDrizzleWritingRepository(input.database),
    }),
  }
}

export { writingLearnerDataPurge } from "#writing/infrastructure/persistence/learner-purge"
