import { createOpenAiClient } from "@workspace/ai/openai-client"
import type { AiFeedbackAttemptTransition } from "@workspace/ai-feedback/application"
import type { AiFeedbackModule } from "@workspace/ai-feedback/module"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import {
  createConfiguredAiFeedbackProvider,
  type OpenAiUsageEvent,
} from "@workspace/ai-feedback/provider"
import {
  createAdminAuthRuntime,
  type AdminAuthRuntime,
} from "@workspace/auth/admin/server"
import {
  createLearnerAuthRuntime,
  type LearnerAuthIdentity,
  type LearnerAuthIdentityResolver,
  type LearnerAuthRuntime,
} from "@workspace/auth/learner/server"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import type { ContentModule } from "@workspace/content/module"
import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
  type WritingAppDatabase,
} from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { IdentityModule } from "@workspace/identity/module"
import type {
  AdminSessionResolver,
  SessionResolver,
} from "@workspace/identity/sessions"
import type { LearningModule } from "@workspace/learning/module"
import { createLearningReportingQuery } from "@workspace/learning/reporting"
import {
  createAppLogger,
  type AppLogger,
} from "@workspace/observability/logger"
import type { OperationsModule } from "@workspace/operations/module"
import type { ResourceLibraryModule } from "@workspace/resource-library/module"
import type {
  CourseId,
  ResourceAssetId,
  ResourceDocumentId,
  ResourceFolderId,
} from "@workspace/types/ids"

import {
  createAdminAuthDatabase,
  createLearnerAuthDatabase,
} from "@/adapters/auth/auth-sqlite-database"
import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"
import { createLearnerTestAuthDisplayNameSynchronizer } from "@/adapters/auth/learner-test-auth-display-name-synchronizer"
import { composeAiFeedbackModule } from "@/composition/ai-feedback-module.composition"
import { createAdminCapabilityRoutes } from "@/composition/admin-route-composition"
import { composeContentModule } from "@/composition/content-module.composition"
import {
  createContainerCleanupCoordinator,
  type ContainerCleanupFailure,
} from "@/composition/container-cleanup"
import { composeIdentityModule } from "@/composition/identity-module.composition"
import {
  composeLearningModule,
  createLearningContentQueryPort,
} from "@/composition/learning-module.composition"
import { composeOperationsModule } from "@/composition/operations-module.composition"
import {
  composeResourceLibraryModule,
  createResourceObjectStorage,
} from "@/composition/resource-library-module.composition"
import type { ApiEnv } from "@/config/env"
import { runApplicationMigrations } from "@/db/migrate"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import { createApiHealthProbe, type ApiHealthProbe } from "@/runtime/api-health"
import { systemClock } from "@/runtime/system-clock"
import {
  createPrefixedIdGenerator,
  uuidGenerator,
} from "@/runtime/uuid-generator"

export type ApiContainer = Readonly<{
  admin: Readonly<{
    authHandler: AdminAuthRuntime["authHandler"]
    capabilityRoutes: AdminRouteGroup
    sessionResolver: AdminSessionResolver
  }>
  dispose: () => Promise<void>
  health: ApiHealthProbe
  learner: Readonly<{
    aiFeedbackRoutes: ReturnType<AiFeedbackModule["createLearnerRoutes"]>
    authHandler: LearnerAuthRuntime["authHandler"]
    identityRoutes: ReturnType<IdentityModule["createLearnerRoutes"]>
    learningRoutes: ReturnType<LearningModule["createLearnerRoutes"]>
    sessionResolver: SessionResolver
  }>
  modules: Readonly<{
    aiFeedback: AiFeedbackModule
    content: ContentModule
    identity: IdentityModule
    learning: LearningModule
    operations: OperationsModule
    resourceLibrary: ResourceLibraryModule
  }>
  platform: Readonly<{
    clock: Clock
    env: ApiEnv
    idGenerator: IdGenerator<string>
    logger: AppLogger
  }>
}>

export type CreateContainerOptions = Readonly<{
  aiFeedbackProvider?: AiFeedbackProvider
  clock?: Clock
  idGenerator?: IdGenerator<string>
  onAiFeedbackAttemptTransition?: (event: AiFeedbackAttemptTransition) => void
  onAiFeedbackUsage?: (event: OpenAiUsageEvent) => void
}>

export async function createContainer(
  env: ApiEnv,
  options: CreateContainerOptions = {}
): Promise<ApiContainer> {
  let logger: AppLogger | undefined
  const cleanup = createContainerCleanupCoordinator({
    onFailure: (failure) => reportCleanupFailure(failure, logger),
  })

  try {
    logger = createAppLogger({ level: env.logLevel, pretty: env.logPretty })
    const flushLogger = onceAsync(() => flushAppLogger(logger as AppLogger))
    cleanup.register("logger", flushLogger)

    const database = createWritingAppDatabase(
      env.databaseUrl ?? getDefaultDatabaseUrl()
    )
    const closeDatabase = onceAsync(database.close)
    cleanup.register("database", closeDatabase)
    runApplicationMigrations(database.sqlite)

    const clock = options.clock ?? systemClock
    const idGenerator = options.idGenerator ?? uuidGenerator
    const aiFeedbackProvider =
      options.aiFeedbackProvider ??
      createConfiguredAiFeedbackProvider({
        model: env.openAiModel,
        onUsage(event) {
          options.onAiFeedbackUsage?.(event)
          logger?.info(event, "ai.usage")
        },
        runtime: createOpenAiClient({
          apiKey: env.openAiApiKey,
          maxRetries: 0,
          timeoutMs: 30_000,
        }),
      })
    let closeOperationsAi: () => Promise<void> = () => Promise.resolve()
    const closeAi = onceAsync(() => closeOperationsAi())
    cleanup.register("ai", closeAi)

    const storage = createResourceObjectStorage(env.adminAssetStore)
    const identityBridge = createLearnerIdentityBridge(database.db)
    const learnerAuth = createLearnerAuthRuntime({
      database: createLearnerAuthDatabase(database.db),
      googleClientId: env.googleClientId,
      googleClientSecret: env.googleClientSecret,
      identityProvisioner: identityBridge.provisioner,
      secret: env.learnerAuthSecret,
      testAuth: env.testAuthEnabled
        ? {
            kind: "enabled",
            ...identityBridge.testAuthDisplayNameSynchronizer,
          }
        : { kind: "disabled" },
      webOrigin: env.webOrigin,
    })
    const adminAuth = createAdminAuthRuntime({
      database: createAdminAuthDatabase(database.db),
      secret: env.adminAuthSecret,
      sessionRevoker: createDrizzleAdminSessionRevoker(database.db),
      webOrigin: env.adminOrigin,
    })

    const content = composeContentModule({
      clock,
      courseIdGenerator: createPrefixedIdGenerator<CourseId>(
        "course-",
        idGenerator
      ),
      database: database.db,
      environment: env.nodeEnv,
    })
    const learningReporting = createLearningReportingQuery({
      content: createLearningContentQueryPort(content),
      database: database.db,
    })
    const identity = composeIdentityModule({
      clock,
      database: database.db,
      learningReport: learningReporting,
    })
    identityBridge.bind(identity)
    const learnerSessionResolver = identity.createLearnerSessionResolver(
      createLearnerAuthenticationPort(learnerAuth.identityResolver)
    )
    const adminSessionResolver = identity.createAdminSessionResolver(
      adminAuth.identityResolver
    )
    const aiFeedback = composeAiFeedbackModule({
      attemptIdGenerator: idGenerator,
      clock,
      database: database.db,
      onAttemptTransition(event) {
        options.onAiFeedbackAttemptTransition?.(event)
        const write = event.toStatus === "failed" ? logger?.warn : logger?.info
        write?.call(logger, event, "ai.feedback.attempt.transition")
      },
      provider: aiFeedbackProvider,
    })
    const learning = composeLearningModule({
      aiFeedback: aiFeedback.application,
      clock,
      content,
      cursorSigningSecret: env.cursorSigningSecret,
      database: database.db,
      identity,
    })
    const resourceLibrary = composeResourceLibraryModule({
      assetIdGenerator: createPrefixedIdGenerator<ResourceAssetId>(
        "resource-asset-",
        idGenerator
      ),
      clock,
      database: database.db,
      documentIdGenerator: createPrefixedIdGenerator<ResourceDocumentId>(
        "resource-document-",
        idGenerator
      ),
      folderIdGenerator: createPrefixedIdGenerator<ResourceFolderId>(
        "resource-folder-",
        idGenerator
      ),
      logger,
      storage,
    })
    const operations = composeOperationsModule({
      aiConfig:
        env.openAiApiKey === undefined
          ? null
          : { apiKey: env.openAiApiKey, model: env.openAiModel },
      clock,
      content,
      database: database.db,
      identity,
      learningReporting: learning.reportingQuery,
      logger,
      resourceLibrary,
    })
    closeOperationsAi = operations.closeAi

    const learnerSession = createLearningLearnerSessionPort(
      learnerSessionResolver
    )
    const adminCapabilityRoutes = createAdminCapabilityRoutes(
      {
        aiConfig:
          env.openAiApiKey === undefined
            ? null
            : { apiKey: env.openAiApiKey, model: env.openAiModel },
        clock,
        content,
        database: database.db,
        identity,
        learningReporting: learning.reportingQuery,
        logger,
        resourceLibrary,
        sessionResolver: adminSessionResolver,
      },
      operations
    )
    const health = createApiHealthProbe(database.sqlite)

    return Object.freeze({
      admin: Object.freeze({
        authHandler: adminAuth.authHandler,
        capabilityRoutes: adminCapabilityRoutes,
        sessionResolver: adminSessionResolver,
      }),
      dispose: () => disposeContainer(cleanup.dispose),
      health,
      learner: Object.freeze({
        aiFeedbackRoutes: aiFeedback.createLearnerRoutes({
          command: learning.aiFeedbackCommand,
          session: learnerSession,
        }),
        authHandler: learnerAuth.authHandler,
        identityRoutes: identity.createLearnerRoutes({
          profileStatsQuery: learning.profileStatsQuery,
          sessionResolver: learnerSessionResolver,
        }),
        learningRoutes: learning.createLearnerRoutes(learnerSession),
        sessionResolver: learnerSessionResolver,
      }),
      modules: Object.freeze({
        aiFeedback,
        content,
        identity,
        learning,
        operations,
        resourceLibrary,
      }),
      platform: Object.freeze({ clock, env, idGenerator, logger }),
    })
  } catch (cause) {
    await cleanup.dispose()
    throw cause
  }
}

function createLearnerIdentityBridge(database: WritingAppDatabase): Readonly<{
  bind: (identity: IdentityModule) => void
  provisioner: Readonly<{
    provision: (identity: LearnerAuthIdentity) => Promise<void>
  }>
  testAuthDisplayNameSynchronizer: ReturnType<
    typeof createLearnerTestAuthDisplayNameSynchronizer
  >
}> {
  let identityModule: IdentityModule | undefined
  const readIdentity = (): IdentityModule => {
    if (identityModule === undefined) {
      throw new Error(
        "learner auth identity bridge가 아직 연결되지 않았습니다."
      )
    }
    return identityModule
  }

  return Object.freeze({
    bind(identity) {
      if (identityModule !== undefined) {
        throw new Error("learner auth identity bridge가 이미 연결됐습니다.")
      }
      identityModule = identity
    },
    provisioner: Object.freeze({
      async provision(authIdentity: LearnerAuthIdentity) {
        await readIdentity().provisioningPort.provision({
          ...authIdentity,
          id: userIdSchema.parse(authIdentity.id),
        })
      },
    }),
    testAuthDisplayNameSynchronizer:
      createLearnerTestAuthDisplayNameSynchronizer(database, {
        changeLearnerDisplayName(input) {
          return readIdentity().application.changeLearnerDisplayName(input)
        },
      }),
  })
}

function createLearnerAuthenticationPort(
  resolver: LearnerAuthIdentityResolver
) {
  return Object.freeze({
    async resolveIdentity(headers: Headers) {
      const identity = await resolver.resolveIdentity(headers)
      if (identity === null) return null
      const userId = userIdSchema.safeParse(identity.id)
      return userId.success ? { ...identity, id: userId.data } : null
    },
  })
}

function createLearningLearnerSessionPort(sessionResolver: SessionResolver) {
  return Object.freeze({
    async resolveLearner(headers: Headers) {
      const session = await sessionResolver.resolveSession(headers)
      if (session === null) return null
      const learnerId = learnerIdSchema.parse(session.user.id)
      if (session.user.status !== "active") {
        return Object.freeze({ kind: "inactive" as const, learnerId })
      }
      return Object.freeze({
        kind: "active" as const,
        learnerId,
      })
    },
  })
}

function onceAsync(operation: () => Promise<void> | void): () => Promise<void> {
  let promise: Promise<void> | undefined
  return () => {
    promise ??= Promise.resolve().then(operation)
    return promise
  }
}

function flushAppLogger(logger: AppLogger): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.flush((error) => {
      if (error === undefined) resolve()
      else reject(error)
    })
  })
}

async function disposeContainer(
  dispose: () => Promise<readonly ContainerCleanupFailure[]>
): Promise<void> {
  const failures = await dispose()
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.cause),
      "API container resource 정리에 실패했습니다."
    )
  }
}

function reportCleanupFailure(
  failure: ContainerCleanupFailure,
  logger: AppLogger | undefined
): void {
  try {
    logger?.error(
      { error: failure.cause, resource: failure.name },
      "server.container.cleanup_failed"
    )
  } catch {
    // 정리 오류 보고 실패가 원래 초기화 오류를 가리지 않게 한다.
  }
}
