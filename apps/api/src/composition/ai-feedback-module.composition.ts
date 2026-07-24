import type {
  AiFeedbackAttemptPolicy,
  AiFeedbackAttemptTransition,
  AiFeedbackDailyQuotaPolicy,
  AiFeedbackUsageEvent,
} from "@workspace/ai-feedback/application"
import {
  createAiFeedbackModule,
  type AiFeedbackModule,
} from "@workspace/ai-feedback/module"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"

export function composeAiFeedbackModule(input: {
  readonly attemptIdGenerator: IdGenerator<string>
  readonly attemptPolicy: AiFeedbackAttemptPolicy
  readonly clock: Clock
  readonly dailyQuotaPolicy: AiFeedbackDailyQuotaPolicy
  readonly database: WritingAppDatabase
  readonly onAttemptTransition?: (event: AiFeedbackAttemptTransition) => void
  readonly onUsage?: (event: AiFeedbackUsageEvent) => void
  readonly provider: AiFeedbackProvider
}): AiFeedbackModule {
  return createAiFeedbackModule({
    attemptIdGenerator: input.attemptIdGenerator,
    attemptPolicy: input.attemptPolicy,
    clock: input.clock,
    dailyQuotaPolicy: input.dailyQuotaPolicy,
    database: input.database,
    observeAttemptTransition: input.onAttemptTransition,
    observeUsage: input.onUsage,
    provider: input.provider,
  })
}
