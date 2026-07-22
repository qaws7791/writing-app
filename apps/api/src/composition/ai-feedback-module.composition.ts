import type { Database } from "bun:sqlite"

import type { AiFeedbackAttemptTransition } from "@workspace/ai-feedback/application"
import {
  createAiFeedbackModule,
  type AiFeedbackModule,
} from "@workspace/ai-feedback/module"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import { runAiFeedbackSchemaMigration } from "@workspace/ai-feedback/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"

export function composeAiFeedbackModule(input: {
  readonly attemptIdGenerator: IdGenerator<string>
  readonly clock: Clock
  readonly database: WritingAppDatabase
  readonly onAttemptTransition?: (event: AiFeedbackAttemptTransition) => void
  readonly provider: AiFeedbackProvider
  readonly sqlite: Database
}): AiFeedbackModule {
  runAiFeedbackSchemaMigration(input.sqlite)

  return createAiFeedbackModule({
    attemptIdGenerator: input.attemptIdGenerator,
    clock: input.clock,
    database: input.database,
    observeAttemptTransition: input.onAttemptTransition,
    provider: input.provider,
  })
}
