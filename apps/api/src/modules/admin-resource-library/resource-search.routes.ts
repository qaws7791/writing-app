import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { adminResourceSearchDtoSchema } from "@workspace/contracts/resource-library/admin-resource-search"
import type { ResourceSearchUseCase } from "@workspace/core/resource-library"
import { z } from "@workspace/http-platform/zod"

import type { AdminSessionResolver } from "@workspace/auth/admin/server"
import {
  defineAdminRoute,
  type AdminRouteHandler,
} from "@/admin/admin-hono-env"
import {
  adminAuthenticatedResponses,
  jsonResponse,
} from "@/admin/admin-openapi"
import { adminSessionRouteOptions } from "@/admin/admin-route-options"
import { positiveIntegerQuery } from "@/modules/admin-resource-library/admin-query-schemas"

const resourceSearchQuerySchema = z.object({
  limit: positiveIntegerQuery({ fallback: 20, max: 50 }),
  query: z.string().trim().min(1).max(200),
})

export type ResourceSearchRouteDependencies = {
  readonly searchService: ResourceSearchUseCase
  readonly sessionResolver: AdminSessionResolver
}

export function createResourceSearchRoutes({
  searchService,
  sessionResolver,
}: ResourceSearchRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "searchAdminResourceLibrary",
    path: "/resources/search",
    request: { query: resourceSearchQuerySchema },
    responses: adminAuthenticatedResponses(
      jsonResponse("자료실 전문 검색 결과입니다.", adminResourceSearchDtoSchema)
    ),
    summary: "자료실 전문 검색",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const query = context.req.valid("query")
    const result = await searchService.search({
      limit: query.limit,
      query: query.query,
    })

    return context.json(adminResourceSearchDtoSchema.parse(result), 200)
  }

  return [defineAdminRoute({ ...routeConfig, handler })] as const
}
