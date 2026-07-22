import type {
  AiFeedbackAttemptTransitionEvent,
  AiFeedbackProvider,
} from "@workspace/core/ai-feedback"
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

import { createAdminAuthDatabase } from "@/adapters/auth/auth-sqlite-database"
import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"
import { createAdminCapabilityRoutes } from "@/composition/admin-route-composition"
import { composeIdentityModule } from "@/composition/identity-module.composition"
import { composeContentModule } from "@/composition/content-module.composition"
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
}

export type CreateApiRuntimeInput = {
  readonly aiFeedbackProvider: AiFeedbackProvider
  readonly env: ApiEnv
  readonly logger: AppLogger
  readonly now?: () => Date
  readonly onAiFeedbackAttemptTransition?: (
    event: AiFeedbackAttemptTransitionEvent
  ) => void
}

export function createApiRuntime(input: CreateApiRuntimeInput): ApiRuntime {
  const databaseClient = createWritingAppDatabase(
    input.env.databaseUrl ?? getDefaultDatabaseUrl()
  )
  const now = input.now ?? (() => new Date())

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
    }) {
      return createAdminCapabilityRoutes({
        content,
        database,
        env: input.env,
        identity,
        logger: input.logger,
        now,
        sessionResolver: adminSessionResolver,
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
    createIdentity(database) {
      return composeIdentityModule({
        database,
        logger: input.logger,
        now,
        sqlite: databaseClient.sqlite,
      })
    },
    createLearnerCore({ database, identity }) {
      return createLearnerApiCore({
        aiFeedbackProvider: input.aiFeedbackProvider,
        apiOrigin: input.env.apiOrigin,
        cursorSigningSecret: input.env.cursorSigningSecret,
        database,
        googleClientId: input.env.googleClientId,
        googleClientSecret: input.env.googleClientSecret,
        identity,
        learnerAuthSecret: input.env.learnerAuthSecret,
        learnerCookieDomain: input.env.learnerCookieDomain,
        onAiFeedbackAttemptTransition: input.onAiFeedbackAttemptTransition,
        testAuthEnabled: input.env.testAuthEnabled,
        webOrigin: input.env.webOrigin,
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
>(input: {
  readonly closeDatabase: () => void
  readonly createAdminAuth: (database: WritingAppDatabase) => TAdminAuth
  readonly createAdminCapabilityRoutes: (input: {
    readonly adminAuth: TAdminAuth
    readonly adminSessionResolver: TAdminSessionResolver
    readonly content: TContent
    readonly database: WritingAppDatabase
    readonly identity: TIdentity
  }) => TAdminCapabilityRoutes
  readonly createAdminSessionResolver: (input: {
    readonly adminAuth: TAdminAuth
    readonly identity: TIdentity
  }) => TAdminSessionResolver
  readonly createContent: (database: WritingAppDatabase) => TContent
  readonly createIdentity: (database: WritingAppDatabase) => TIdentity
  readonly createLearnerCore: (input: {
    readonly database: WritingAppDatabase
    readonly identity: TIdentity
  }) => TLearnerCore
  readonly database: WritingAppDatabase
}): {
  readonly adminAuth: TAdminAuth
  readonly adminCapabilityRoutes: TAdminCapabilityRoutes
  readonly adminSessionResolver: TAdminSessionResolver
  readonly content: TContent
  readonly dispose: () => void
  readonly identity: TIdentity
  readonly learnerCore: TLearnerCore
} {
  const dispose = createCloseOnce(input.closeDatabase)

  try {
    const identity = input.createIdentity(input.database)
    const content = input.createContent(input.database)
    const learnerCore = input.createLearnerCore({
      database: input.database,
      identity,
    })
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
    })

    return {
      adminAuth,
      adminCapabilityRoutes,
      adminSessionResolver,
      content,
      dispose,
      identity,
      learnerCore,
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
