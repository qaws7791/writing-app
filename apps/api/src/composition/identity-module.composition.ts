import type { WritingAppDatabase } from "@workspace/db/client"
import {
  createIdentityModule,
  type IdentityModule,
} from "@workspace/identity/module"
import type { IdentityLearningReportPort } from "@workspace/identity/ports"
import type { LearnerDeletionMarkerStorePort } from "@workspace/identity/ports"
import type { Clock } from "@workspace/kernel/clock"

import { createIdentitySessionRevocation } from "@/adapters/auth/identity-session-revocation"
import { createDeletedLearnerPurgeRepository } from "@/adapters/identity/deleted-learner-purge-repository"
import { createLearnerIdentityDirectory } from "@/adapters/auth/learner-identity-directory"
import { createInMemoryDeletionMarkerStore } from "@/adapters/identity/deletion-marker-store"

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
    deletedLearnerPurgeRepository: createDeletedLearnerPurgeRepository(
      input.database
    ),
    learningReport: input.learningReport,
    learnerIdentityDirectory: createLearnerIdentityDirectory(input.database),
    sessionRevocation: createIdentitySessionRevocation(input.database),
  })
}
