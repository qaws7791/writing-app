import type { AiFeedbackAttemptTransition } from "@workspace/ai-feedback/application"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import type { OpenAiUsageEvent } from "@workspace/ai-feedback/provider"
import {
  createAdminAuthRuntime,
  type AdminAuthIdentityResolver,
} from "@workspace/auth/admin/server"
import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
  type WritingAppDatabase,
} from "@workspace/db/client"
import type { IdentityModule } from "@workspace/identity/module"
import type { ContentModule } from "@workspace/content/module"
import type { AdminSessionResolver } from "@workspace/identity/sessions"
import type { ResourceLibraryModule } from "@workspace/resource-library/module"
import { runLearningSchemaMigration } from "@workspace/learning/migration"
import { createLearningReportingQuery } from "@workspace/learning/reporting"

import { createAdminAuthDatabase } from "@/adapters/auth/auth-sqlite-database"
import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"
import { createAdminCapabilityRoutes } from "@/composition/admin-route-composition"
import { composeIdentityModule } from "@/composition/identity-module.composition"
import { composeContentModule } from "@/composition/content-module.composition"
import { createLearningContentQueryPort } from "@/composition/learning-module.composition"
import { composeResourceLibraryModule } from "@/composition/resource-library-module.composition"
import type { ApiEnv } from "@/config/env"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import { createLearnerApiCore, type LearnerApiCore } from "@/learner-api-core"
import type { AppLogger } from "@workspace/observability/logger"

export type AdminAuth = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly identityResolver: AdminAuthIdentityResolver
}

export type ApiRuntime = {
  readonly adminAuth: AdminAuth
  readonly adminCapabilityRoutes: AdminRouteGroup
  readonly adminSessionResolver: AdminSessionResolver
  readonly content: ContentModule
  readonly dispose: () => void
  readonly identity: IdentityModule
  readonly learnerCore: LearnerApiCore
  readonly resourceLibrary: ResourceLibraryModule
}

export type CreateApiRuntimeInput = {
  readonly aiFeedbackProvider?: AiFeedbackProvider
  readonly env: ApiEnv
  readonly logger: AppLogger
  readonly now?: () => Date
  readonly onAiFeedbackAttemptTransition?: (
    event: AiFeedbackAttemptTransition
  ) => void
  readonly onAiFeedbackUsage?: (event: OpenAiUsageEvent) => void
}

export function createApiRuntime(input: CreateApiRuntimeInput): ApiRuntime {
  const databaseClient = createWritingAppDatabase(
    input.env.databaseUrl ?? getDefaultDatabaseUrl()
  )
  const now = input.now ?? (() => new Date())
  runLearningSchemaMigration(databaseClient.sqlite)

  return assembleApiRuntime({
    closeDatabase: databaseClient.close,
    createAdminAuth(database) {
      return createAdminAuthRuntime({
        apiOrigin: input.env.apiOrigin,
        cookieDomain: input.env.adminCookieDomain,
        database: createAdminAuthDatabase(database),
        secret: input.env.adminAuthSecret,
        sessionRevoker: createDrizzleAdminSessionRevoker(database),
        webOrigin: input.env.adminOrigin,
      })
    },
    createAdminCapabilityRoutes({
      adminSessionResolver,
      content,
      database,
      identity,
      resourceLibrary,
    }) {
      return createAdminCapabilityRoutes({
        content,
        database,
        env: input.env,
        identity,
        learningReporting: createLearningReportingQuery({
          content: createLearningContentQueryPort(content),
          database,
        }),
        logger: input.logger,
        now,
        resourceLibrary,
        sessionResolver: adminSessionResolver,
        sqlite: databaseClient.sqlite,
      })
    },
    createAdminSessionResolver({ adminAuth, identity }) {
      return identity.createAdminSessionResolver(adminAuth.identityResolver)
    },
    createContent(database) {
      return composeContentModule({
        database,
        environment: input.env.nodeEnv,
        logger: input.logger,
        now,
      })
    },
    createIdentity({ content, database }) {
      return composeIdentityModule({
        database,
        learningReport: createLearningReportingQuery({
          content: createLearningContentQueryPort(content),
          database,
        }),
        logger: input.logger,
        now,
        sqlite: databaseClient.sqlite,
      })
    },
    createLearnerCore({ content, database, identity }) {
      return createLearnerApiCore({
        aiFeedbackApiKey: input.env.openAiApiKey,
        aiFeedbackModel: input.env.openAiModel,
        aiFeedbackProvider: input.aiFeedbackProvider,
        apiOrigin: input.env.apiOrigin,
        cursorSigningSecret: input.env.cursorSigningSecret,
        content,
        database,
        googleClientId: input.env.googleClientId,
        googleClientSecret: input.env.googleClientSecret,
        identity,
        learnerAuthSecret: input.env.learnerAuthSecret,
        learnerCookieDomain: input.env.learnerCookieDomain,
        logger: input.logger,
        now,
        onAiFeedbackAttemptTransition: input.onAiFeedbackAttemptTransition,
        onAiFeedbackUsage: input.onAiFeedbackUsage,
        sqlite: databaseClient.sqlite,
        testAuthEnabled: input.env.testAuthEnabled,
        webOrigin: input.env.webOrigin,
      })
    },
    createResourceLibrary(database) {
      return composeResourceLibraryModule({
        assetStore: input.env.adminAssetStore,
        database,
        logger: input.logger,
        now,
        sqlite: databaseClient.sqlite,
      })
    },
    database: databaseClient.db,
  })
}

export function assembleApiRuntime<
  TLearnerCore,
  TAdminAuth,
  TAdminSessionResolver,
  TAdminCapabilityRoutes,
  TIdentity,
  TContent,
  TResourceLibrary,
>(input: {
  readonly closeDatabase: () => void
  readonly createAdminAuth: (database: WritingAppDatabase) => TAdminAuth
  readonly createAdminCapabilityRoutes: (input: {
    readonly adminAuth: TAdminAuth
    readonly adminSessionResolver: TAdminSessionResolver
    readonly content: TContent
    readonly database: WritingAppDatabase
    readonly identity: TIdentity
    readonly resourceLibrary: TResourceLibrary
  }) => TAdminCapabilityRoutes
  readonly createAdminSessionResolver: (input: {
    readonly adminAuth: TAdminAuth
    readonly identity: TIdentity
  }) => TAdminSessionResolver
  readonly createContent: (database: WritingAppDatabase) => TContent
  readonly createIdentity: (input: {
    readonly content: TContent
    readonly database: WritingAppDatabase
  }) => TIdentity
  readonly createLearnerCore: (input: {
    readonly content: TContent
    readonly database: WritingAppDatabase
    readonly identity: TIdentity
  }) => TLearnerCore
  readonly createResourceLibrary: (
    database: WritingAppDatabase
  ) => TResourceLibrary
  readonly database: WritingAppDatabase
}): {
  readonly adminAuth: TAdminAuth
  readonly adminCapabilityRoutes: TAdminCapabilityRoutes
  readonly adminSessionResolver: TAdminSessionResolver
  readonly content: TContent
  readonly dispose: () => void
  readonly identity: TIdentity
  readonly learnerCore: TLearnerCore
  readonly resourceLibrary: TResourceLibrary
} {
  const dispose = createCloseOnce(input.closeDatabase)

  try {
    const content = input.createContent(input.database)
    const identity = input.createIdentity({
      content,
      database: input.database,
    })
    const learnerCore = input.createLearnerCore({
      content,
      database: input.database,
      identity,
    })
    const resourceLibrary = input.createResourceLibrary(input.database)
    const adminAuth = input.createAdminAuth(input.database)
    const adminSessionResolver = input.createAdminSessionResolver({
      adminAuth,
      identity,
    })
    const adminCapabilityRoutes = input.createAdminCapabilityRoutes({
      adminAuth,
      adminSessionResolver,
      content,
      database: input.database,
      identity,
      resourceLibrary,
    })

    return {
      adminAuth,
      adminCapabilityRoutes,
      adminSessionResolver,
      content,
      dispose,
      identity,
      learnerCore,
      resourceLibrary,
    }
  } catch (error) {
    dispose()
    throw error
  }
}

function createCloseOnce(close: () => void): () => void {
  let closed = false

  return () => {
    if (closed) return

    closed = true
    close()
  }
}
