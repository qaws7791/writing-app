import type { WritingAppDatabase } from "@workspace/db/client"
import {
  createDeletedLearnerPurgeRepository,
  createIdentityModule,
  type IdentityModule,
} from "@workspace/identity/module"
import type { IdentityLearningReportPort } from "@workspace/identity/ports"
import type { LearnerDeletionMarkerStorePort } from "@workspace/identity/ports"
import type { Clock } from "@workspace/kernel/clock"

import { createIdentitySessionRevocation } from "@/adapters/auth/identity-session-revocation"
import { createLearnerIdentityDirectory } from "@/adapters/auth/learner-identity-directory"
import { createInMemoryDeletionMarkerStore } from "@/adapters/identity/deletion-marker-store"
import { learnerDataPurgePorts } from "@/privacy/learner-data-purge"

export function composeIdentityModule(input: {
  readonly clock: Clock
  readonly database: WritingAppDatabase
  readonly deletionMarkerStore?: LearnerDeletionMarkerStorePort
  readonly learningReport: IdentityLearningReportPort
}): IdentityModule {
  return createIdentityModule({
    clock: input.clock,
    database: input.database,
    deletionMarkerStore:
      input.deletionMarkerStore ?? createInMemoryDeletionMarkerStore(),
    deletedLearnerPurgeRepository: createDeletedLearnerPurgeRepository({
      database: input.database,
      learnerDataPurges: learnerDataPurgePorts,
    }),
    learningReport: input.learningReport,
    learnerIdentityDirectory: createLearnerIdentityDirectory(input.database),
    sessionRevocation: createIdentitySessionRevocation(input.database),
  })
}
