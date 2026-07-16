import type { SessionResolver } from "@workspace/core/auth"
import type { LearnerAiFeedbackTransitionService } from "@workspace/core/ai-feedback"
import type { LearnerContentService } from "@workspace/core/content"
import type {
  LearnerTransitionService,
  ProfileReader,
  ProgressService,
} from "@workspace/core/learning"
import type {
  RequestLogger,
  RequestLoggingRuntime,
  SecurityAuditLogger,
} from "@workspace/logger"
import type { InternalErrorLogger } from "@workspace/hono/errors"

import type { LearnerContractErrorLogger } from "@/http/learner-response"

export type ApiDependencies = {
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly contentService: LearnerContentService
  readonly contractErrorLogger?: LearnerContractErrorLogger
  readonly deploymentVersion?: string
  readonly errorLogger?: InternalErrorLogger
  readonly learnerAiFeedbackService: LearnerAiFeedbackTransitionService
  readonly learnerTransitionService: LearnerTransitionService
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
