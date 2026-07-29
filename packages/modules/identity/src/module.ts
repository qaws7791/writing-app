import type { WritingAppDatabase } from "@workspace/db/client"

import {
  createAdminUserMutationUseCase,
  createAdminUserReader,
  createIdentityLearningQuery,
  type AdminUserMutationUseCase,
  type AdminUserReader,
  type IdentityLearningQuery,
} from "#identity/application/identity-queries"
import type {
  AdminAuthenticationPort,
  AuthenticatedLearnerIdentity,
  DeletedLearnerPurgeRepository,
  IdentityApplicationDependencies,
  IdentityLearningReportPort,
  LearnerAuthenticationPort,
} from "#identity/application/identity-ports"
import {
  createDeletedLearnerPurgeCommand,
  type DeletedLearnerPurgeCommand,
} from "#identity/application/deleted-learner-purge"
import {
  createIdentityApplication,
  type IdentityApplication,
} from "#identity/application/identity-service"
import {
  createAdminSessionResolver,
  createLearnerSessionResolver,
  type AdminSessionResolver,
  type SessionResolver,
} from "#identity/application/identity-sessions"
import { createDrizzleIdentityRepository } from "#identity/infrastructure/persistence/identity-drizzle-repository"

export type IdentityModule = Readonly<{
  adminUserMutation: AdminUserMutationUseCase
  adminUserReader: AdminUserReader
  application: IdentityApplication
  createAdminSessionResolver: (
    authentication: AdminAuthenticationPort
  ) => AdminSessionResolver
  createLearnerSessionResolver: (
    authentication: LearnerAuthenticationPort
  ) => SessionResolver
  deletedLearnerPurge: DeletedLearnerPurgeCommand
  learningQuery: IdentityLearningQuery
  provisioningPort: Readonly<{
    provision: (identity: AuthenticatedLearnerIdentity) => Promise<void>
  }>
}>

export function createIdentityModule(
  input: Omit<IdentityApplicationDependencies, "repository"> & {
    readonly database: WritingAppDatabase
    readonly deletedLearnerPurgeRepository: DeletedLearnerPurgeRepository
    readonly learningReport: IdentityLearningReportPort
  }
): IdentityModule {
  const repository = createDrizzleIdentityRepository(input.database)
  const application = createIdentityApplication({ ...input, repository })
  const adminUserReader = createAdminUserReader({
    learningReport: input.learningReport,
    learnerIdentityDirectory: input.learnerIdentityDirectory,
    repository,
  })
  const adminUserMutation = createAdminUserMutationUseCase({
    application,
    reader: adminUserReader,
  })

  return {
    adminUserMutation,
    adminUserReader,
    application,
    createAdminSessionResolver(authentication) {
      return createAdminSessionResolver({ application, authentication })
    },
    createLearnerSessionResolver(authentication) {
      return createLearnerSessionResolver({ application, authentication })
    },
    deletedLearnerPurge: createDeletedLearnerPurgeCommand({
      clock: input.clock,
      repository: input.deletedLearnerPurgeRepository,
    }),
    learningQuery: createIdentityLearningQuery({
      learnerIdentityDirectory: input.learnerIdentityDirectory,
      repository,
    }),
    provisioningPort: {
      async provision(identity: AuthenticatedLearnerIdentity) {
        const result = await application.provisionLearner(identity)
        if (result.isErr()) {
          throw new Error(`identity provisioning failed: ${result.error.kind}`)
        }
      },
    },
  }
}

export { createDeletedLearnerPurgeCommand } from "#identity/application/deleted-learner-purge"
export { createDeletedLearnerPurgeRepository } from "#identity/infrastructure/persistence/deleted-learner-purge-repository"
export { createDeletionMarkerReapplicationRepository } from "#identity/infrastructure/persistence/deletion-marker-reapplication-repository"
export { identityLearnerDataPurge } from "#identity/infrastructure/persistence/learner-purge"
export { seedLearnerIdentity } from "#identity/infrastructure/persistence/seed"
