import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { jsonResponse } from "@workspace/http-platform/openapi"
import { z } from "@workspace/http-platform/zod"
import { adminResourceSearchDtoSchema } from "@workspace/contracts/resource-library/admin-resource-search"

import type { ResourceAdminSessionPort } from "#resource-library/application/ports/resource-library-ports"
import type { ResourceSearchQuery } from "#resource-library/application/resource-library-queries"
import { resourceLibrarySessionRouteOptions } from "#resource-library/interface/http/resource-library-http-auth"
import { toResourceSearchItemDto } from "#resource-library/interface/http/resource-library-http-mapper"
import { positiveResourceIntegerQuery } from "#resource-library/interface/http/resource-library-query-schema"
import {
  defineResourceLibraryRoute,
  resourceLibraryAuthenticatedResponses,
  type ResourceLibraryRouteHandler,
} from "#resource-library/interface/http/resource-library-http-support"

const resourceSearchQuerySchema = z.object({
  limit: positiveResourceIntegerQuery({ fallback: 20, max: 50 }),
  query: z.string().trim().min(1).max(200),
})

export function createResourceSearchRoutes(input: {
  readonly query: ResourceSearchQuery
  readonly sessionPort: ResourceAdminSessionPort
}) {
  const routeConfig = {
    method: "get",
    operationId: "searchAdminResourceLibrary",
    path: "/resources/search",
    request: { query: resourceSearchQuerySchema },
    responses: resourceLibraryAuthenticatedResponses(
      jsonResponse("자료실 전문 검색 결과입니다.", adminResourceSearchDtoSchema)
    ),
    summary: "자료실 전문 검색",
    ...resourceLibrarySessionRouteOptions(input.sessionPort),
  } satisfies AnyRouteConfig
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const items = await input.query.search(context.req.valid("query"))
    return context.json(
      adminResourceSearchDtoSchema.parse({
        items: items.map(toResourceSearchItemDto),
      }),
      200
    )
  }
  return Object.freeze([
    defineResourceLibraryRoute({ ...routeConfig, handler }),
  ])
}
