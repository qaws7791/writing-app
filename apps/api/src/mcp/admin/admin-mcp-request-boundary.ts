import {
  hostHeaderValidationResponse,
  originValidationResponse,
  type AuthInfo,
} from "@modelcontextprotocol/server"
import { withPrivateNoStore } from "@workspace/http-platform/security"
import type { RequestLogger } from "@workspace/observability/request-logger"
import type { SecurityAuditLogger } from "@workspace/observability/security-audit-logger"

import { adminMcpPath } from "@/mcp/admin/admin-mcp-configuration"

type AdminMcpPublicRequestRejection = Readonly<{
  reasonCode: "invalid_host" | "invalid_origin"
  response: Response
}>

export function rejectInvalidAdminMcpPublicRequest(
  input: Readonly<{
    requestLogger: RequestLogger
    resourceUrl: string
    securityAuditLogger: SecurityAuditLogger
  }>,
  request: Request,
  requestId: string,
  durationMs: number
): Response | undefined {
  const rejection = validateAdminMcpPublicRequest(request, input.resourceUrl)
  if (rejection === undefined) return undefined

  const response = withAdminMcpResponseHeaders(rejection.response, requestId)
  logAdminMcpSecurityDenial(input, request, requestId, rejection.reasonCode)
  logAdminMcpRequestCompletion(
    input,
    request,
    requestId,
    response.status,
    durationMs
  )
  return response
}

function validateAdminMcpPublicRequest(
  request: Request,
  resourceUrl: string
): AdminMcpPublicRequestRejection | undefined {
  const allowedHostnames = [new URL(resourceUrl).hostname]
  const hostRejection = hostHeaderValidationResponse(request, allowedHostnames)
  if (hostRejection !== undefined) {
    return { reasonCode: "invalid_host", response: hostRejection }
  }

  const originRejection = originValidationResponse(request, allowedHostnames)
  return originRejection === undefined
    ? undefined
    : { reasonCode: "invalid_origin", response: originRejection }
}

export function logAdminMcpRequestCompletion(
  input: Readonly<{
    requestLogger: RequestLogger
    resourceUrl: string
  }>,
  request: Request,
  requestId: string,
  status: number,
  durationMs: number,
  authInfo?: AuthInfo
): void {
  try {
    const adminId = authInfo?.extra?.["adminId"]
    input.requestLogger({
      ...(authInfo === undefined
        ? {}
        : {
            ...(typeof adminId === "string"
              ? { actorId: adminId, actorType: "admin" as const }
              : {}),
            mcpCredentialId: authInfo.clientId,
          }),
      audience: "admin-mcp",
      durationMs,
      ...(status < 400
        ? {}
        : { errorClass: status >= 500 ? "server-error" : "client-error" }),
      method: request.method,
      outcome: status < 400 ? "succeeded" : "failed",
      path: adminMcpPath,
      requestId,
      status,
    })
  } catch {
    // Logging failures must not replace the MCP response.
  }
}

function logAdminMcpSecurityDenial(
  input: Readonly<{
    resourceUrl: string
    securityAuditLogger: SecurityAuditLogger
  }>,
  request: Request,
  requestId: string,
  reasonCode: AdminMcpPublicRequestRejection["reasonCode"]
): void {
  try {
    input.securityAuditLogger({
      action: "authorization.denied",
      outcome: "denied",
      reasonCode,
      requestId,
      target: adminMcpPath,
    })
  } catch {
    // Security logging failures must not replace the fail-closed response.
  }
}

export function withAdminMcpResponseHeaders(
  response: Response,
  requestId: string
): Response {
  const secured = withPrivateNoStore(response)
  const headers = new Headers(secured.headers)
  headers.set("x-request-id", requestId)
  return new Response(secured.body, {
    headers,
    status: secured.status,
    statusText: secured.statusText,
  })
}
