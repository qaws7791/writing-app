import type { WritingCheckProvider } from "@workspace/writing/ports"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import {
  createWritingModule,
  type WritingModule,
} from "@workspace/writing/module"
import type {
  WritingCheckId,
  WritingId,
  WritingTaskId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"

export function composeWritingModule(input: {
  readonly checkIdGenerator: IdGenerator<WritingCheckId>
  readonly clock: Clock
  readonly dailySuccessfulCheckLimit: number
  readonly database: WritingAppDatabase
  readonly idGenerator: IdGenerator<WritingId>
  readonly checkProvider: WritingCheckProvider
  readonly publicationIdGenerator: IdGenerator<WritingTaskPublicationId>
  readonly taskIdGenerator: IdGenerator<WritingTaskId>
}): WritingModule {
  return createWritingModule({
    checkIdGenerator: input.checkIdGenerator,
    checkProvider: input.checkProvider,
    clock: input.clock,
    dailySuccessfulCheckLimit: input.dailySuccessfulCheckLimit,
    database: input.database,
    idGenerator: input.idGenerator,
    publicationIdGenerator: input.publicationIdGenerator,
    taskIdGenerator: input.taskIdGenerator,
  })
}
