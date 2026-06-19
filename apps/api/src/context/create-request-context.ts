import type { SessionResolver } from "@workspace/core/modules/auth"
import type { AiFeedbackService } from "@workspace/core/modules/ai-feedback"
import type { LearnerContentService } from "@workspace/core/modules/content"
import type {
  LearningService,
  ProfileReader,
  ProgressService,
} from "@workspace/core/modules/learning"
import type { RequestLogger, RequestLoggingRuntime } from "@workspace/logger"

export type ApiDependencies = {
  readonly aiFeedbackService: AiFeedbackService
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly contentService: LearnerContentService
  readonly learningService: LearningService
  readonly now?: () => Date
  readonly profileReader: ProfileReader
  readonly progressService: ProgressService
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly sessionResolver: SessionResolver
  readonly webOrigin?: string
}

export type ApiRequestContext = Omit<ApiDependencies, "now"> & {
  readonly now: () => Date
}

export function createRequestContext(
  dependencies: ApiDependencies
): ApiRequestContext {
  return {
    ...dependencies,
    now: dependencies.now ?? (() => new Date()),
  }
}
