import type { SessionResolver } from "@workspace/core/auth"
import type { LearnerAiFeedbackTransitionService } from "@workspace/core/ai-feedback"
import type {
  CompleteLearnerStepTransitionResult,
  LearnerContentService,
  LearnerCursorCodec,
  LearnerTransitionError,
  LearnerTransitionRepository,
  ProfileReader,
  ProgressService,
} from "@workspace/core/learning"
import type { InternalErrorLogger } from "@/http/platform/errors"
import type { RequestLoggingRuntime } from "@/http/platform/request-logging.middleware"
import type { RequestLogger } from "@/observability/request-logger"
import type { SecurityAuditLogger } from "@/observability/security-audit-logger"

import type { LearnerContractErrorLogger } from "@/http/learner-response"

export type ApiDependencies = {
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly contentService: LearnerContentService
  readonly contractErrorLogger?: LearnerContractErrorLogger
  readonly deploymentVersion?: string
  readonly errorLogger?: InternalErrorLogger
  readonly learnerAiFeedbackService: LearnerAiFeedbackTransitionService<
    LearnerTransitionError,
    CompleteLearnerStepTransitionResult
  >
  readonly learnerCursorCodec: LearnerCursorCodec
  readonly learnerTransitionRepository: Pick<
    LearnerTransitionRepository,
    "completeStep" | "startLesson"
  >
  readonly now?: () => Date
  readonly profileReader: ProfileReader
  readonly progressService: ProgressService
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly securityAuditLogger?: SecurityAuditLogger
  readonly sessionResolver: SessionResolver
  readonly webOrigin?: string
}

export type ApiRequestContext = Omit<ApiDependencies, "now"> & {
  readonly deploymentVersion: string
  readonly now: () => Date
}

export function createRequestContext(
  dependencies: ApiDependencies
): ApiRequestContext {
  return {
    ...dependencies,
    deploymentVersion: dependencies.deploymentVersion ?? "local",
    now: dependencies.now ?? (() => new Date()),
  }
}
