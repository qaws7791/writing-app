import type { AiFeedbackAttemptTransition } from "@workspace/ai-feedback/application"
import {
  createAiFeedbackModule,
  type AiFeedbackModule,
} from "@workspace/ai-feedback/module"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"

export function composeAiFeedbackModule(input: {
  readonly attemptIdGenerator: IdGenerator<string>
  readonly clock: Clock
  readonly database: WritingAppDatabase
  readonly onAttemptTransition?: (event: AiFeedbackAttemptTransition) => void
  readonly provider: AiFeedbackProvider
}): AiFeedbackModule {
  return createAiFeedbackModule({
    attemptIdGenerator: input.attemptIdGenerator,
    clock: input.clock,
    database: input.database,
    observeAttemptTransition: input.onAttemptTransition,
    provider: input.provider,
  })
}
