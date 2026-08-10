import {
  createRoute,
  type OpenAPIHono,
  type RouteConfig,
} from "@hono/zod-openapi"
import {
  adminMcpApprovalDtoSchema,
  adminMcpApprovalParamsSchema,
} from "@workspace/contracts/operations/admin-mcp-approvals"
import { AppError } from "@workspace/http-platform/errors"
import { jsonResponse } from "@workspace/http-platform/openapi"

import type { AdminMcpApprovals } from "#operations/application/admin-mcp-approvals"
import type { AdminMcpApprovalError } from "#operations/domain/admin-mcp-approval"
import {
  operationsSessionRouteOptions,
  type OperationsHonoEnv,
} from "#operations/interface/http/operations-http-auth"
import {
  operationsAuthenticatedResponses,
  operationsErrorResponse,
} from "#operations/interface/http/operations-http-support"
import { toAdminMcpApprovalDto } from "#operations/interface/http/operations-http-presenter"
import type { OperationsAdminSessionPort } from "#operations/application/ports/operations-ports"

export function registerOperationsApprovalRoutes<
  TEnv extends OperationsHonoEnv,
>(
  app: OpenAPIHono<TEnv>,
  input: {
    readonly approvals: AdminMcpApprovals
    readonly session: OperationsAdminSessionPort
  }
): void {
  registerReadApprovalRoute(app, input)
  registerDecisionRoute(app, input, "approve")
  registerDecisionRoute(app, input, "reject")
}

function registerReadApprovalRoute<TEnv extends OperationsHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: {
    readonly approvals: AdminMcpApprovals
    readonly session: OperationsAdminSessionPort
  }
): void {
  const route = createRoute({
    method: "get",
    operationId: "getAdminMcpApproval",
    path: "/mcp-approvals/{approvalId}",
    request: { params: adminMcpApprovalParamsSchema },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse(
          "관리자 MCP 변경 승인 요청입니다.",
          adminMcpApprovalDtoSchema
        )
      ),
      404: operationsErrorResponse("승인 요청을 찾을 수 없습니다."),
      503: operationsErrorResponse("승인 요청을 조회할 수 없습니다."),
    },
    summary: "관리자 MCP 변경 승인 요청 조회",
    ...operationsSessionRouteOptions(input.session),
  } satisfies RouteConfig)

  app.openapi(route, async (context) => {
    const result = await input.approvals.readForOwner({
      approvalId: context.req.valid("param").approvalId,
      ownerAdminId: context.var.operationsActor.id,
    })
    if (result.isErr()) throw mapApprovalError(result.error)
    return context.json(toAdminMcpApprovalDto(result.value), 200)
  })
}

function registerDecisionRoute<TEnv extends OperationsHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: {
    readonly approvals: AdminMcpApprovals
    readonly session: OperationsAdminSessionPort
  },
  decision: "approve" | "reject"
): void {
  const decisionLabel = decision === "approve" ? "승인" : "거절"
  const route = createRoute({
    method: "post",
    operationId:
      decision === "approve" ? "approveAdminMcpChange" : "rejectAdminMcpChange",
    path: `/mcp-approvals/{approvalId}/${decision}`,
    request: { params: adminMcpApprovalParamsSchema },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse(
          `${decisionLabel}된 관리자 MCP 변경 요청입니다.`,
          adminMcpApprovalDtoSchema
        )
      ),
      404: operationsErrorResponse("승인 요청을 찾을 수 없습니다."),
      409: operationsErrorResponse("승인 요청 상태가 이미 변경됐습니다."),
      410: operationsErrorResponse("승인 요청이 만료됐습니다."),
      503: operationsErrorResponse("승인 요청 상태를 변경할 수 없습니다."),
    },
    summary: `관리자 MCP 변경 요청 ${decisionLabel}`,
    ...operationsSessionRouteOptions(input.session),
  } satisfies RouteConfig)

  app.openapi(route, async (context) => {
    const result = await input.approvals.decide({
      approvalId: context.req.valid("param").approvalId,
      decision,
      ownerAdminId: context.var.operationsActor.id,
    })
    if (result.isErr()) throw mapApprovalError(result.error)
    return context.json(toAdminMcpApprovalDto(result.value), 200)
  })
}

function mapApprovalError(error: AdminMcpApprovalError): AppError {
  switch (error.kind) {
    case "admin-mcp-approval-not-found":
      return new AppError({
        code: "MCP_APPROVAL_NOT_FOUND",
        message: "MCP approval was not found",
        status: 404,
      })
    case "admin-mcp-approval-expired":
      return new AppError({
        code: "MCP_APPROVAL_EXPIRED",
        message: "MCP approval expired",
        status: 410,
      })
    case "admin-mcp-approval-conflict":
    case "admin-mcp-approval-not-pending":
      return new AppError({
        code: "MCP_APPROVAL_CONFLICT",
        message: "MCP approval state changed",
        status: 409,
      })
    case "admin-mcp-approval-invalid":
    case "admin-mcp-approval-binding-mismatch":
      return new AppError({
        code: "MCP_APPROVAL_INVALID",
        message: "MCP approval request is invalid",
        status: 400,
      })
    case "admin-mcp-approval-persistence-failed":
      return new AppError({
        cause: error,
        code: "MCP_APPROVAL_UNAVAILABLE",
        message: "MCP approval persistence is unavailable",
        status: 503,
      })
  }
}
