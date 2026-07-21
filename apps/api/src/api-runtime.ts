import type {
  AiFeedbackAttemptTransitionEvent,
  AiFeedbackProvider,
} from "@workspace/core/ai-feedback"
import {
  createAdminAuthRuntime,
  type AdminSessionResolver,
} from "@workspace/auth/admin/server"
import {
  createWritingAppDatabase,
  type WritingAppDatabase,
} from "@workspace/db"

import { createAdminAuthDatabase } from "@/adapters/auth/auth-sqlite-database"
import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"
import { createAdminCapabilityRoutes } from "@/composition/admin-route-composition"
import type { ApiEnv } from "@/config/env"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import { createLearnerApiCore, type LearnerApiCore } from "@/learner-api-core"
import type { AppLogger } from "@/observability/app-logger"

export type AdminAuth = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly sessionResolver: AdminSessionResolver
}

export type ApiRuntime = {
  readonly adminAuth: AdminAuth
  readonly adminCapabilityRoutes: AdminRouteGroup
  readonly dispose: () => void
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
  const databaseClient = createWritingAppDatabase(input.env.databaseUrl)

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
    createAdminCapabilityRoutes({ adminAuth, database }) {
      return createAdminCapabilityRoutes({
        database,
        env: input.env,
        logger: input.logger,
        now: input.now ?? (() => new Date()),
        sessionResolver: adminAuth.sessionResolver,
      })
    },
    createLearnerCore(database) {
      return createLearnerApiCore({
        aiFeedbackProvider: input.aiFeedbackProvider,
        apiOrigin: input.env.apiOrigin,
        cursorSigningSecret: input.env.cursorSigningSecret,
        database,
        googleClientId: input.env.googleClientId,
        googleClientSecret: input.env.googleClientSecret,
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
  TAdminCapabilityRoutes,
>(input: {
  readonly closeDatabase: () => void
  readonly createAdminAuth: (database: WritingAppDatabase) => TAdminAuth
  readonly createAdminCapabilityRoutes: (input: {
    readonly adminAuth: TAdminAuth
    readonly database: WritingAppDatabase
  }) => TAdminCapabilityRoutes
  readonly createLearnerCore: (database: WritingAppDatabase) => TLearnerCore
  readonly database: WritingAppDatabase
}): {
  readonly adminAuth: TAdminAuth
  readonly adminCapabilityRoutes: TAdminCapabilityRoutes
  readonly dispose: () => void
  readonly learnerCore: TLearnerCore
} {
  const dispose = createCloseOnce(input.closeDatabase)

  try {
    const learnerCore = input.createLearnerCore(input.database)
    const adminAuth = input.createAdminAuth(input.database)
    const adminCapabilityRoutes = input.createAdminCapabilityRoutes({
      adminAuth,
      database: input.database,
    })

    return { adminAuth, adminCapabilityRoutes, dispose, learnerCore }
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
