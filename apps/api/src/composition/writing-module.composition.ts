import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import {
  createWritingModule,
  type WritingModule,
} from "@workspace/writing/module"
import type { WritingId } from "@workspace/types/ids"

export function composeWritingModule(input: {
  readonly clock: Clock
  readonly database: WritingAppDatabase
  readonly idGenerator: IdGenerator<WritingId>
}): WritingModule {
  return createWritingModule(input)
}
