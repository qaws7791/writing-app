import {
  createRoute,
  type OpenAPIHono,
  type RouteConfig,
} from "@hono/zod-openapi"
import {
  adminAuditEventsDtoSchema,
  adminAuditEventsQuerySchema,
} from "@workspace/contracts/operations/admin-audit"
import { AppError } from "@workspace/http-platform/errors"
import { jsonResponse } from "@workspace/http-platform/openapi"

import type { AuditTrail } from "#operations/application/audit-trail"
import type { OperationsAdminSessionPort } from "#operations/application/ports/operations-ports"
import {
  operationsSessionRouteOptions,
  type OperationsHonoEnv,
} from "#operations/interface/http/operations-http-auth"
import {
  operationsAuthenticatedResponses,
  operationsErrorResponse,
} from "#operations/interface/http/operations-http-support"
import { toAdminAuditEventsDto } from "#operations/interface/http/operations-http-presenter"

export function registerOperationsAuditRoutes<TEnv extends OperationsHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: {
    readonly auditTrail: AuditTrail
    readonly session: OperationsAdminSessionPort
  }
): void {
  const route = createRoute({
    method: "get",
    operationId: "getAdminAuditEvents",
    path: "/audit-events",
    request: { query: adminAuditEventsQuerySchema },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse(
          "관리자 감사 이벤트 목록입니다.",
          adminAuditEventsDtoSchema
        )
      ),
      400: operationsErrorResponse(
        "감사 이벤트 조회 조건이 올바르지 않습니다."
      ),
      503: operationsErrorResponse("감사 이벤트를 조회할 수 없습니다."),
    },
    summary: "관리자 감사 이벤트 조회",
    ...operationsSessionRouteOptions(input.session),
  } satisfies RouteConfig)

  app.openapi(route, async (context) => {
    const query = context.req.valid("query")
    const result = await input.auditTrail.readEvents({
      actor: context.var.operationsActor,
      category: query.category ?? null,
      from: query.from ?? null,
      page: query.page,
      pageSize: query.pageSize,
      to: query.to ?? null,
    })
    if (result.isErr()) {
      throw result.error.kind === "invalid-audit-query"
        ? new AppError({
            code: "AUDIT_QUERY_INVALID",
            message: "Audit query is invalid",
            status: 400,
          })
        : new AppError({
            code: "AUDIT_READ_FAILED",
            message: "Audit trail is unavailable",
            status: 503,
          })
    }

    return context.json(toAdminAuditEventsDto(result.value), 200)
  })
}
