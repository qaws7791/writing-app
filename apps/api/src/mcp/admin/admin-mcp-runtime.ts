import {
  createMcpHandler,
  createRequestStateCodec,
  requireBearerAuth,
  type AuthInfo,
  type ServerContext,
} from "@modelcontextprotocol/server"
import type { RequestLogger } from "@workspace/observability/request-logger"
import type { SecurityAuditLogger } from "@workspace/observability/security-audit-logger"

import type { AdminMcpAuthentication } from "@/mcp/admin/admin-mcp-auth"
import type { AdminMcpChangeRequestState } from "@/mcp/admin/admin-mcp-changes"
import {
  adminMcpPath,
  adminMcpReadScope,
  type AdminMcpConfiguration,
} from "@/mcp/admin/admin-mcp-configuration"
import {
  logAdminMcpRequestCompletion,
  rejectInvalidAdminMcpPublicRequest,
  withAdminMcpResponseHeaders,
} from "@/mcp/admin/admin-mcp-request-boundary"
import { createAdminMcpServer } from "@/mcp/admin/admin-mcp-tools"

type AdminMcpServerDependencies = Parameters<typeof createAdminMcpServer>[0]

export type AdminMcpRuntime = Readonly<{
  close: () => Promise<void>
  fetch: (
    request: Request,
    options: Readonly<{ requestId: string }>
  ) => Promise<Response>
}>

export function createAdminMcpRuntime(input: {
  readonly authentication: AdminMcpAuthentication
  readonly configuration: AdminMcpConfiguration
  readonly reportProtocolError?: (() => void) | undefined
  readonly requestLogger: RequestLogger
  readonly securityAuditLogger: SecurityAuditLogger
  readonly tools: AdminMcpServerDependencies
}): AdminMcpRuntime {
  const requestBoundary = {
    requestLogger: input.requestLogger,
    resourceUrl: input.configuration.resourceUrl,
    securityAuditLogger: input.securityAuditLogger,
  }
  const requestStateCodec =
    input.configuration.changes === undefined
      ? undefined
      : createRequestStateCodec<AdminMcpChangeRequestState>({
          bind: bindRequestState,
          key: input.configuration.changes.requestStateSecret,
          ttlSeconds: input.configuration.changes.approvalTtlMs / 1_000,
        })
  const requireAuthentication = requireBearerAuth({
    requiredScopes: [adminMcpReadScope],
    verifier: input.authentication.verifier,
  })
  const handler = createMcpHandler(
    (context) =>
      createAdminMcpServer(input.tools, {
        changeConfiguration: input.configuration.changes,
        era: context.era,
        requestStateCodec,
        scopes: context.authInfo?.scopes ?? [],
      }),
    {
      legacy: "stateless",
      onerror() {
        try {
          input.reportProtocolError?.()
        } catch {
          // Reporting failures must not alter the protocol response.
        }
      },
    }
  )

  return {
    close: handler.close,
    async fetch(request, options) {
      const startedAt = performance.now()
      const publicRejection = rejectInvalidAdminMcpPublicRequest(
        requestBoundary,
        request,
        options.requestId,
        performance.now() - startedAt
      )
      if (publicRejection !== undefined) return publicRejection

      let authInfo: AuthInfo | undefined
      let response: Response

      try {
        if (new URL(request.url).pathname !== adminMcpPath) {
          response = new Response("Not found", { status: 404 })
        } else {
          const authentication = await requireAuthentication(request)
          if (authentication instanceof Response) {
            response = authentication
            logAuthenticationDenial(
              input,
              options.requestId,
              authentication.status
            )
          } else {
            authInfo = {
              ...authentication,
              extra: {
                ...authentication.extra,
                requestId: options.requestId,
              },
            }
            response = await handler.fetch(request, { authInfo })
          }
        }
      } catch {
        response = new Response(JSON.stringify({ error: "server_error" }), {
          headers: { "content-type": "application/json" },
          status: 500,
        })
      }

      const securedResponse = withAdminMcpResponseHeaders(
        response,
        options.requestId
      )
      logAdminMcpRequestCompletion(
        requestBoundary,
        request,
        options.requestId,
        securedResponse.status,
        performance.now() - startedAt,
        authInfo
      )
      return securedResponse
    },
  }
}

function bindRequestState(context: ServerContext): string {
  const adminId = context.http?.authInfo?.extra?.["adminId"]
  return [
    context.mcpReq.method,
    typeof adminId === "string" ? adminId : "",
    context.http?.authInfo?.clientId ?? "",
  ].join("\0")
}

function logAuthenticationDenial(
  input: Pick<
    Parameters<typeof createAdminMcpRuntime>[0],
    "securityAuditLogger"
  >,
  requestId: string,
  status: number
): void {
  try {
    input.securityAuditLogger({
      action: status === 403 ? "authorization.denied" : "authentication.failed",
      outcome: "denied",
      reasonCode: status === 403 ? "insufficient_scope" : "invalid_token",
      requestId,
      target: adminMcpPath,
    })
  } catch {
    // Security logging failures must not alter the authentication response.
  }
}
