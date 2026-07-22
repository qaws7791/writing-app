import type { WritingAppDatabase } from "@workspace/db/client"

import {
  createAdminUserMutationUseCase,
  createAdminUserReader,
  createIdentityLearningQuery,
  createOperationsIdentityReportingQuery,
  type AdminUserMutationUseCase,
  type AdminUserReader,
  type IdentityLearningQuery,
  type OperationsIdentityReportingQuery,
} from "#identity/application/identity-queries"
import type {
  AdminAuthenticationPort,
  AuthenticatedLearnerIdentity,
  IdentityApplicationDependencies,
  IdentityLearningReportPort,
  LearnerAuthenticationPort,
  LearnerProfileStatsQuery,
} from "#identity/application/identity-ports"
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
import {
  createAdminIdentityRoutes,
  createLearnerIdentityRoutes,
  type IdentityHttpRouteGroup,
} from "#identity/interface/http/identity-http"
import { createDrizzleIdentityRepository } from "#identity/infrastructure/persistence/identity-drizzle-repository"

export type IdentityModule = Readonly<{
  adminUserMutation: AdminUserMutationUseCase
  adminUserReader: AdminUserReader
  application: IdentityApplication
  createAdminRoutes: (
    sessionResolver: AdminSessionResolver
  ) => IdentityHttpRouteGroup
  createAdminSessionResolver: (
    authentication: AdminAuthenticationPort
  ) => AdminSessionResolver
  createLearnerRoutes: (input: {
    readonly profileStatsQuery: LearnerProfileStatsQuery
    readonly sessionResolver: SessionResolver
  }) => ReturnType<typeof createLearnerIdentityRoutes>
  createLearnerSessionResolver: (
    authentication: LearnerAuthenticationPort
  ) => SessionResolver
  learningQuery: IdentityLearningQuery
  operationsReportingQuery: OperationsIdentityReportingQuery
  provisioningPort: Readonly<{
    provision: (identity: AuthenticatedLearnerIdentity) => Promise<void>
  }>
}>

export function createIdentityModule(
  input: Omit<IdentityApplicationDependencies, "repository"> & {
    readonly database: WritingAppDatabase
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

  return Object.freeze({
    adminUserMutation,
    adminUserReader,
    application,
    createAdminRoutes(sessionResolver) {
      return createAdminIdentityRoutes({
        sessionResolver,
        userMutationService: adminUserMutation,
        userReader: adminUserReader,
      })
    },
    createAdminSessionResolver(authentication) {
      return createAdminSessionResolver({ application, authentication })
    },
    createLearnerRoutes(routeInput) {
      return createLearnerIdentityRoutes(routeInput)
    },
    createLearnerSessionResolver(authentication) {
      return createLearnerSessionResolver({ application, authentication })
    },
    learningQuery: createIdentityLearningQuery({
      learnerIdentityDirectory: input.learnerIdentityDirectory,
      repository,
    }),
    operationsReportingQuery: createOperationsIdentityReportingQuery({
      learnerIdentityDirectory: input.learnerIdentityDirectory,
      repository,
    }),
    provisioningPort: Object.freeze({
      async provision(identity: AuthenticatedLearnerIdentity) {
        const result = await application.provisionLearner(identity)
        if (result.isErr()) {
          throw new Error(`identity provisioning failed: ${result.error.kind}`)
        }
      },
    }),
  })
}
