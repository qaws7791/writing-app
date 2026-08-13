import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import {
  createOpenAiWritingCheckProvider,
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
  readonly openAi: Readonly<{
    apiKey: string | undefined
    maxRetries: number
    model: string
    timeoutMs: number
  }>
  readonly publicationIdGenerator: IdGenerator<WritingTaskPublicationId>
  readonly taskIdGenerator: IdGenerator<WritingTaskId>
}): WritingModule {
  return createWritingModule({
    checkIdGenerator: input.checkIdGenerator,
    checkProvider: createOpenAiWritingCheckProvider(input.openAi),
    clock: input.clock,
    dailySuccessfulCheckLimit: input.dailySuccessfulCheckLimit,
    database: input.database,
    idGenerator: input.idGenerator,
    publicationIdGenerator: input.publicationIdGenerator,
    taskIdGenerator: input.taskIdGenerator,
  })
}
