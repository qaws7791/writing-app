import { createOpenAiClient } from "@workspace/ai/openai-client"
import type {
  AiFeedbackAttemptTransition,
  AiFeedbackUsageEvent,
} from "@workspace/ai-feedback/application"
import type { AiFeedbackModule } from "@workspace/ai-feedback/module"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import { createConfiguredAiFeedbackProvider } from "@workspace/ai-feedback/provider"
import {
  createAdminAuthRuntime,
  type AdminAuthRuntime,
} from "@workspace/auth/admin/server"
import type { AuthEmailDeliveryPort } from "@workspace/auth/email/delivery"
import { createInMemoryAuthEmailDelivery } from "@workspace/auth/email/in-memory"
import { createResendAuthEmailDelivery } from "@workspace/auth/email/resend"
import {
  createLearnerAuthRuntime,
  type LearnerAuthIdentity,
  type LearnerAuthIdentityResolver,
  type LearnerAuthRuntime,
} from "@workspace/auth/learner/server"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import type { ContentApplication } from "@workspace/content/application"
import type { ContentAssetStoragePort } from "@workspace/content/ports"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { IdentityModule } from "@workspace/identity/module"
import type {
  AdminSessionResolver,
  SessionResolver,
} from "@workspace/identity/sessions"
import type { LearningModule } from "@workspace/learning/module"
import type { LearningLearnerSessionPort } from "@workspace/learning/http"
import { createLearningReportingQuery } from "@workspace/learning/reporting"
import {
  createAppLogger,
  type AppLogger,
} from "@workspace/observability/logger"
import type { OperationsModule } from "@workspace/operations/module"
import {
  logEventNames,
  logRetentionClasses,
  type AiUsageEvent,
} from "@workspace/observability/events"
import type { ContentAssetId, CourseId } from "@workspace/types/ids"
import { createS3PrivateObjectStorage } from "@workspace/storage/private-object-storage"

import {
  createAdminAuthDatabase,
  createLearnerAuthDatabase,
} from "@/adapters/auth/auth-sqlite-database"
import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"
import { composeAiFeedbackModule } from "@/composition/ai-feedback-module.composition"
import { composeContentApplication } from "@/composition/content-application.composition"
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
import type { ApiEnv } from "@/config/env"
import { runApplicationMigrations } from "@/db/migrate"
import { createApiHealthProbe, type ApiHealthProbe } from "@/runtime/api-health"
import { systemClock } from "@/runtime/system-clock"
import {
  createPrefixedIdGenerator,
  uuidGenerator,
} from "@/runtime/uuid-generator"
import {
  createInMemoryDeletionMarkerStore,
  createS3DeletionMarkerStore,
} from "@/adapters/identity/deletion-marker-store"

export type ApiContainer = Readonly<{
  admin: Readonly<{
    authHandler: AdminAuthRuntime["authHandler"]
    sessionResolver: AdminSessionResolver
  }>
  dispose: () => Promise<void>
  health: ApiHealthProbe
  learner: Readonly<{
    authHandler: LearnerAuthRuntime["authHandler"]
    learningSession: LearningLearnerSessionPort
    sessionResolver: SessionResolver
  }>
  modules: Readonly<{
    aiFeedback: AiFeedbackModule
    content: ContentApplication
    identity: IdentityModule
    learning: LearningModule
    operations: OperationsModule
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
  authEmailDelivery?: AuthEmailDeliveryPort
  clock?: Clock
  contentAssetStorage?: ContentAssetStoragePort
  idGenerator?: IdGenerator<string>
  onAiFeedbackAttemptTransition?: (event: AiFeedbackAttemptTransition) => void
  onAiFeedbackUsage?: (event: AiFeedbackUsageEvent) => void
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

    const databaseUrl = env.databaseUrl ?? getDefaultDatabaseUrl()
    const database = createWritingAppDatabase(databaseUrl)
    const closeDatabase = onceAsync(database.close)
    cleanup.register("database", closeDatabase)
    runApplicationMigrations(database.sqlite)
    const reportingDatabase = createReadOnlyWritingAppDatabase(databaseUrl)
    cleanup.register("reporting-database", onceAsync(reportingDatabase.close))

    const clock = options.clock ?? systemClock
    const idGenerator = options.idGenerator ?? uuidGenerator
    const aiFeedbackProvider =
      options.aiFeedbackProvider ??
      createConfiguredAiFeedbackProvider({
        model: env.openAiModel,
        runtime: createOpenAiClient({
          apiKey: env.openAiApiKey,
          maxRetries: 0,
          timeoutMs: env.aiFeedback.attemptPolicy.providerTimeoutMs,
        }),
      })
    const identityBridge = createLearnerIdentityBridge()
    const learnerAuth = createLearnerAuthRuntime({
      database: createLearnerAuthDatabase(database.db),
      emailDelivery:
        options.authEmailDelivery ?? createAuthEmailDelivery(env.authEmail),
      googleClientId: env.googleClientId,
      googleClientSecret: env.googleClientSecret,
      identityProvisioner: identityBridge.provisioner,
      secret: env.learnerAuthSecret,
      webOrigin: env.webOrigin,
    })
    const adminAuth = createAdminAuthRuntime({
      database: createAdminAuthDatabase(database.db),
      secret: env.adminAuthSecret,
      sessionRevoker: createDrizzleAdminSessionRevoker(database.db),
      webOrigin: env.adminOrigin,
    })

    const content = composeContentApplication({
      assetIdGenerator: createPrefixedIdGenerator<ContentAssetId>(
        "content-asset-",
        idGenerator
      ),
      assetStorage: options.contentAssetStorage,
      assetStore: env.adminAssetStore,
      clock,
      courseIdGenerator: createPrefixedIdGenerator<CourseId>(
        "course-",
        idGenerator
      ),
      database: database.db,
    })
    const learningReporting = createLearningReportingQuery({
      content: createLearningContentQueryPort(content),
      database: database.db,
    })
    const identity = composeIdentityModule({
      clock,
      database: database.db,
      deletionMarkerStore: createDeletionMarkerStore({
        configuration: env.deletionMarkerStore,
        idGenerator,
      }),
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
      attemptPolicy: env.aiFeedback.attemptPolicy,
      clock,
      dailyQuotaPolicy: env.aiFeedback.dailyQuotaPolicy,
      database: database.db,
      onAttemptTransition(event) {
        options.onAiFeedbackAttemptTransition?.(event)
        const write = event.toStatus === "failed" ? logger?.warn : logger?.info
        write?.call(logger, event, "ai.feedback.attempt.transition")
      },
      onUsage(event) {
        options.onAiFeedbackUsage?.(event)
        const logEvent = {
          durationMs: event.latencyMs,
          event: logEventNames.aiUsage,
          ...(event.failureCode === undefined
            ? {}
            : { failureCode: event.failureCode }),
          ...(event.inputTokens === undefined
            ? {}
            : { inputTokens: event.inputTokens }),
          model: event.model,
          operation: "feedback",
          outcome: event.outcome,
          ...(event.outputTokens === undefined
            ? {}
            : { outputTokens: event.outputTokens }),
          promptPolicyVersion: event.promptPolicyVersion,
          provider: event.provider,
          retentionClass: logRetentionClasses.aiUsage,
          ...(event.inputTokens === undefined ||
          event.outputTokens === undefined
            ? {}
            : { totalTokens: event.inputTokens + event.outputTokens }),
        } satisfies AiUsageEvent
        const write =
          event.outcome === "succeeded" ? logger?.info : logger?.warn
        write?.call(logger, logEvent, logEventNames.aiUsage)
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
    const operations = composeOperationsModule({
      clock,
      database: database.db,
      idGenerator,
      logger,
      reportingDatabase: reportingDatabase.sqlite,
    })

    const learnerSession = createLearningLearnerSessionPort(
      learnerSessionResolver
    )
    const health = createApiHealthProbe(database.sqlite)

    return {
      admin: {
        authHandler: adminAuth.authHandler,
        sessionResolver: adminSessionResolver,
      },
      dispose: () => disposeContainer(cleanup.dispose),
      health,
      learner: {
        authHandler: learnerAuth.authHandler,
        learningSession: learnerSession,
        sessionResolver: learnerSessionResolver,
      },
      modules: {
        aiFeedback,
        content,
        identity,
        learning,
        operations,
      },
      platform: { clock, env, idGenerator, logger },
    }
  } catch (cause) {
    await cleanup.dispose()
    throw cause
  }
}

function createDeletionMarkerStore(input: {
  readonly configuration: ApiEnv["deletionMarkerStore"]
  readonly idGenerator: IdGenerator<string>
}) {
  if (input.configuration === undefined) {
    return createInMemoryDeletionMarkerStore()
  }

  const objectStorage = createS3PrivateObjectStorage(input.configuration)
  if (objectStorage.isErr()) {
    throw new Error("private 삭제 marker 저장소 설정이 올바르지 않습니다.")
  }
  return createS3DeletionMarkerStore({
    idGenerator: input.idGenerator,
    objectStorage: objectStorage.value,
    prefix: input.configuration.prefix,
  })
}

function createAuthEmailDelivery(
  configuration: ApiEnv["authEmail"]
): AuthEmailDeliveryPort {
  return configuration.kind === "resend"
    ? createResendAuthEmailDelivery({
        apiKey: configuration.apiKey,
        from: configuration.from,
        replyTo: configuration.replyTo,
      })
    : createInMemoryAuthEmailDelivery()
}

function createLearnerIdentityBridge(): Readonly<{
  bind: (identity: IdentityModule) => void
  provisioner: Readonly<{
    provision: (identity: LearnerAuthIdentity) => Promise<void>
  }>
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

  return {
    bind(identity) {
      if (identityModule !== undefined) {
        throw new Error("learner auth identity bridge가 이미 연결됐습니다.")
      }
      identityModule = identity
    },
    provisioner: {
      async provision(authIdentity: LearnerAuthIdentity) {
        await readIdentity().provisioningPort.provision({
          ...authIdentity,
          id: userIdSchema.parse(authIdentity.id),
        })
      },
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
      const learnerId = learnerIdSchema.parse(session.user.id)
      if (session.user.status !== "active") {
        return { kind: "inactive" as const, learnerId }
      }
      return {
        kind: "active" as const,
        learnerId,
      }
    },
  }
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
