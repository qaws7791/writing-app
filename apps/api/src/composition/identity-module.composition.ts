import type { WritingAppDatabase } from "@workspace/db/client"
import {
  createIdentityModule,
  type IdentityModule,
} from "@workspace/identity/module"
import type { IdentityLearningReportPort } from "@workspace/identity/ports"
import type { Clock } from "@workspace/kernel/clock"

import { createIdentitySessionRevocation } from "@/adapters/auth/identity-session-revocation"
import { createLearnerIdentityDirectory } from "@/adapters/auth/learner-identity-directory"

export function composeIdentityModule(input: {
  readonly clock: Clock
  readonly database: WritingAppDatabase
  readonly learningReport: IdentityLearningReportPort
}): IdentityModule {
  return createIdentityModule({
    clock: input.clock,
    database: input.database,
    learningReport: input.learningReport,
    learnerIdentityDirectory: createLearnerIdentityDirectory(input.database),
    sessionRevocation: createIdentitySessionRevocation(input.database),
  })
}
