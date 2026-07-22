import type { Database } from "bun:sqlite"

import type { AiFeedbackAttemptTransition } from "@workspace/ai-feedback/application"
import type { AiFeedbackHttpRouteGroup } from "@workspace/ai-feedback/http"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import type { OpenAiUsageEvent } from "@workspace/ai-feedback/provider"
import {
  createLearnerAuthRuntime,
  type LearnerAuthIdentity,
  type LearnerAuthIdentityResolver,
} from "@workspace/auth/learner/server"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import type { ContentModule } from "@workspace/content/module"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentityModule } from "@workspace/identity/module"
import type { SessionResolver } from "@workspace/identity/sessions"
import type { LearningHttpRouteGroup } from "@workspace/learning/http"

import { createLearnerAuthDatabase } from "@/adapters/auth/auth-sqlite-database"
import { createLearnerTestAuthDisplayNameSynchronizer } from "@/adapters/auth/learner-test-auth-display-name-synchronizer"
import { composeAiFeedbackModule } from "@/composition/ai-feedback-module.composition"
import { composeLearningModule } from "@/composition/learning-module.composition"
import type { AppLogger } from "@workspace/observability/logger"

export type CreateLearnerApiCoreInput = {
  readonly aiFeedbackProvider?: AiFeedbackProvider
  readonly aiFeedbackModel: string
  readonly aiFeedbackApiKey?: string
  readonly apiOrigin: string
  readonly content: ContentModule
  readonly cursorSigningSecret: string
  readonly database: WritingAppDatabase
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly learnerAuthSecret: string
  readonly learnerCookieDomain?: string
  readonly identity: IdentityModule
  readonly logger: AppLogger
  readonly now?: () => Date
  readonly onAiFeedbackAttemptTransition?: (
    event: AiFeedbackAttemptTransition
  ) => void
  readonly onAiFeedbackUsage?: (event: OpenAiUsageEvent) => void
  readonly sqlite: Database
  readonly testAuthEnabled?: boolean
  readonly webOrigin: string
}

export type LearnerApiCore = Readonly<{
  aiFeedbackRoutes: AiFeedbackHttpRouteGroup
  authHandler: (request: Request) => Promise<Response>
  identityRoutes: ReturnType<IdentityModule["createLearnerRoutes"]>
  learningRoutes: LearningHttpRouteGroup
  sessionResolver: SessionResolver
}>

export function createLearnerApiCore(
  input: CreateLearnerApiCoreInput
): LearnerApiCore {
  const now = input.now ?? (() => new Date())
  const auth = createLearnerAuthRuntime({
    apiOrigin: input.apiOrigin,
    database: createLearnerAuthDatabase(input.database),
    googleClientId: input.googleClientId,
    googleClientSecret: input.googleClientSecret,
    identityProvisioner: createIdentityProvisioner(input.identity),
    secret: input.learnerAuthSecret,
    cookieDomain: input.learnerCookieDomain,
    testAuth:
      input.testAuthEnabled === true
        ? {
            kind: "enabled",
            ...createLearnerTestAuthDisplayNameSynchronizer(
              input.database,
              input.identity.application
            ),
          }
        : { kind: "disabled" },
    webOrigin: input.webOrigin,
  })
  const sessionResolver = input.identity.createLearnerSessionResolver(
    createLearnerAuthenticationPort(auth.identityResolver)
  )
  const aiFeedback = composeAiFeedbackModule({
    apiKey: input.aiFeedbackApiKey,
    database: input.database,
    model: input.aiFeedbackModel,
    now,
    onAttemptTransition: input.onAiFeedbackAttemptTransition,
    onUsage: input.onAiFeedbackUsage,
    provider: input.aiFeedbackProvider,
    sqlite: input.sqlite,
  })
  const learning = composeLearningModule({
    aiFeedback: aiFeedback.application,
    content: input.content,
    cursorSigningSecret: input.cursorSigningSecret,
    database: input.database,
    identity: input.identity,
    logger: input.logger,
    now,
    sqlite: input.sqlite,
  })
  const learnerSession = createLearningLearnerSessionPort(sessionResolver)

  return Object.freeze({
    aiFeedbackRoutes: aiFeedback.createLearnerRoutes({
      command: learning.aiFeedbackCommand,
      session: learnerSession,
    }),
    authHandler: auth.authHandler,
    identityRoutes: input.identity.createLearnerRoutes({
      profileStatsQuery: learning.profileStatsQuery,
      sessionResolver,
    }),
    learningRoutes: learning.createLearnerRoutes(learnerSession),
    sessionResolver,
  })
}

function createIdentityProvisioner(identity: IdentityModule) {
  return {
    async provision(authIdentity: LearnerAuthIdentity) {
      await identity.provisioningPort.provision({
        ...authIdentity,
        id: userIdSchema.parse(authIdentity.id),
      })
    },
  }
}

function createLearnerAuthenticationPort(
  resolver: LearnerAuthIdentityResolver
) {
  return {
    async resolveIdentity(headers: Headers) {
      const identity = await resolver.resolveIdentity(headers)
      if (identity === null) return null
      const userId = userIdSchema.safeParse(identity.id)
      return userId.success ? { ...identity, id: userId.data } : null
    },
  }
}

function createLearningLearnerSessionPort(sessionResolver: SessionResolver) {
  return {
    async resolveLearner(headers: Headers) {
      const session = await sessionResolver.resolveSession(headers)
      if (session === null) return null
      if (session.user.status !== "active") return { kind: "inactive" as const }
      return {
        kind: "active" as const,
        learnerId: learnerIdSchema.parse(session.user.id),
      }
    },
  }
}
