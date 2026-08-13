import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type {
  WritingCheckId,
  WritingId,
  WritingTaskId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"

import { createWritingAdminApplication } from "#writing/application/writing-admin-application"
import { createWritingApplication } from "#writing/application/writing-application"
import type {
  WritingAdminApplication,
  WritingApplication,
  WritingCheckProvider,
} from "#writing/application/ports/writing-ports"
import { createDrizzleWritingRepository } from "#writing/infrastructure/persistence/writing-drizzle-repository"

export type WritingModule = Readonly<{
  adminApplication: WritingAdminApplication
  application: WritingApplication
}>

export function createWritingModule(input: {
  readonly checkIdGenerator: IdGenerator<WritingCheckId>
  readonly checkProvider: WritingCheckProvider
  readonly clock: Clock
  readonly dailySuccessfulCheckLimit: number
  readonly database: WritingAppDatabase
  readonly idGenerator: IdGenerator<WritingId>
  readonly publicationIdGenerator: IdGenerator<WritingTaskPublicationId>
  readonly taskIdGenerator: IdGenerator<WritingTaskId>
}): WritingModule {
  const repository = createDrizzleWritingRepository(input.database)
  return {
    adminApplication: createWritingAdminApplication({
      clock: input.clock,
      publicationIdGenerator: input.publicationIdGenerator,
      repository,
      taskIdGenerator: input.taskIdGenerator,
    }),
    application: createWritingApplication({
      checkIdGenerator: input.checkIdGenerator,
      checkProvider: input.checkProvider,
      clock: input.clock,
      dailySuccessfulCheckLimit: input.dailySuccessfulCheckLimit,
      idGenerator: input.idGenerator,
      repository,
    }),
  }
}

export { writingLearnerDataPurge } from "#writing/infrastructure/persistence/learner-purge"
export { seedWritingDatabase } from "#writing/infrastructure/persistence/seed"
export { createOpenAiWritingCheckProvider } from "#writing/infrastructure/ai/openai-writing-check-provider"
