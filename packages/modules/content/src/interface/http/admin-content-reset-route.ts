import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { jsonResponse } from "@workspace/http-platform/openapi"
import { adminContentResetResultSchema } from "@workspace/contracts/content/admin-content-reset"

import type { ContentApplication } from "#content/application/content-application"
import type { ContentAdminSessionPort } from "#content/application/ports/content-ports"
import { contentMutationRouteOptions } from "#content/interface/http/content-http-auth"
import { mapContentError } from "#content/interface/http/content-http-errors"
import { toAdminContentResetResult } from "#content/interface/http/content-http-mapper"
import {
  contentAuthenticatedResponses,
  contentErrorJsonResponse,
  defineContentRoute,
  type ContentRouteHandler,
} from "#content/interface/http/content-http-support"

export function createAdminContentResetRoute(dependencies: {
  readonly application: ContentApplication
  readonly sessionPort: ContentAdminSessionPort
}) {
  const routeConfig = {
    method: "post",
    operationId: "resetAdminContent",
    path: "/maintenance/content-reset",
    responses: {
      ...contentAuthenticatedResponses(
        jsonResponse("콘텐츠 초기화 결과입니다.", adminContentResetResultSchema)
      ),
      403: contentErrorJsonResponse("이 환경에서는 초기화할 수 없습니다."),
    },
    summary: "어드민 콘텐츠 초기화",
    ...contentMutationRouteOptions(dependencies.sessionPort),
  } satisfies AnyRouteConfig

  const handler: ContentRouteHandler<typeof routeConfig> = async (context) => {
    const result = await dependencies.application.resetContent({
      actor: context.var.contentActor,
    })
    if (result.isErr()) throw mapContentError(result.error)
    return context.json(toAdminContentResetResult(result.value), 200)
  }

  return defineContentRoute({ ...routeConfig, handler })
}
