import type { HttpPlatformEnv } from "@workspace/http-platform/app"
import type { IdentityLearnerHonoEnv } from "@workspace/identity/http"
import type { LearningHonoEnv } from "@workspace/learning/http"

import type { ApiRequestContext } from "@/middleware/create-request-context"

type ApiRuntimeHonoEnv = HttpPlatformEnv<{
  requestContext: ApiRequestContext
}>

export type ApiHonoEnv = ApiRuntimeHonoEnv &
  IdentityLearnerHonoEnv &
  LearningHonoEnv
