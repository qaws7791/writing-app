import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminResourceSearchDtoSchema,
  adminResourceTreeScopeSchema,
} from "@workspace/contracts/admin"
import type { ResourceSearchUseCase } from "@workspace/core/modules/resource-library/api"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { adminAuthenticatedResponses, jsonResponse } from "@/http/openapi"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"
import { positiveIntegerQuery } from "@/routes/query-schemas"

const resourceSearchQuerySchema = z.object({
  limit: positiveIntegerQuery({ fallback: 20, max: 50 }),
  query: z.string().trim().min(1).max(200),
  scope: adminResourceTreeScopeSchema.optional().default("active"),
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

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(await searchService.search(context.req.valid("query")), 200)

  return [defineAdminRoute({ ...routeConfig, handler })] as const
}
