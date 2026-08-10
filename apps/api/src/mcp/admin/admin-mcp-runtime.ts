import {
  createMcpHandler,
  createRequestStateCodec,
  getOAuthProtectedResourceMetadataUrl,
  hostHeaderValidationResponse,
  oauthMetadataResponse,
  originValidationResponse,
  requireBearerAuth,
  type AuthInfo,
  type ServerContext,
} from "@modelcontextprotocol/server"
import { withPrivateNoStore } from "@workspace/http-platform/security"
import type { RequestLogger } from "@workspace/observability/request-logger"
import type { SecurityAuditLogger } from "@workspace/observability/security-audit-logger"

import type { AdminMcpAuthentication } from "@/mcp/admin/admin-mcp-auth"
import {
  adminMcpDraftScope,
  adminMcpLifecycleScope,
  adminMcpPath,
  adminMcpPublishScope,
  adminMcpReadScope,
  adminMcpUserDeleteScope,
  adminMcpUserStatusScope,
  type AdminMcpConfiguration,
} from "@/mcp/admin/admin-mcp-configuration"
import type { AdminMcpChangeRequestState } from "@/mcp/admin/admin-mcp-changes"
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
  const resourceUrl = new URL(input.configuration.resourceUrl)
  const allowedHostnames = [resourceUrl.hostname]
  const requestStateCodec =
    input.configuration.changes === undefined
      ? undefined
      : createRequestStateCodec<AdminMcpChangeRequestState>({
          bind: bindRequestState,
          key: input.configuration.changes.requestStateSecret,
          ttlSeconds: input.configuration.changes.approvalTtlMs / 1_000,
        })
  const scopesSupported =
    input.configuration.changes === undefined
      ? [adminMcpReadScope]
      : [
          adminMcpReadScope,
          adminMcpDraftScope,
          adminMcpLifecycleScope,
          adminMcpPublishScope,
          adminMcpUserStatusScope,
          adminMcpUserDeleteScope,
        ]
  const authMetadataOptions = {
    dangerouslyAllowInsecureIssuerUrl:
      new URL(input.configuration.oauthIssuer).protocol !== "https:",
    oauthMetadata: input.authentication.oauthMetadata,
    resourceName: "Writing App Admin MCP",
    resourceServerUrl: resourceUrl,
    scopesSupported,
  }
  const protectedResourceMetadataUrl =
    getOAuthProtectedResourceMetadataUrl(resourceUrl)
  const requireAuthentication = requireBearerAuth({
    requiredScopes: [adminMcpReadScope],
    resourceMetadataUrl: protectedResourceMetadataUrl,
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
          // 오류 보고 실패가 MCP protocol 응답을 바꾸면 안 된다.
        }
      },
    }
  )

  return {
    close: handler.close,
    async fetch(request, options) {
      const startedAt = performance.now()
      let authInfo: AuthInfo | undefined
      let response: Response

      try {
        const hostRejection = hostHeaderValidationResponse(
          request,
          allowedHostnames
        )
        if (hostRejection !== undefined) {
          response = hostRejection
          logSecurityDenial(input, request, options.requestId, "invalid_host")
        } else {
          const originRejection = originValidationResponse(
            request,
            allowedHostnames
          )
          if (originRejection !== undefined) {
            response = originRejection
            logSecurityDenial(
              input,
              request,
              options.requestId,
              "invalid_origin"
            )
          } else {
            const metadata = oauthMetadataResponse(request, authMetadataOptions)
            if (metadata !== undefined) {
              response = metadata
            } else if (new URL(request.url).pathname !== adminMcpPath) {
              response = new Response("Not found", { status: 404 })
            } else {
              const authentication = await requireAuthentication(request)
              if (authentication instanceof Response) {
                response = authentication
                logAuthenticationDenial(
                  input,
                  request,
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
      logRequestCompletion(
        input,
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

function logRequestCompletion(
  input: Pick<
    Parameters<typeof createAdminMcpRuntime>[0],
    "configuration" | "requestLogger"
  >,
  request: Request,
  requestId: string,
  status: number,
  durationMs: number,
  authInfo: AuthInfo | undefined
): void {
  try {
    input.requestLogger({
      ...(authInfo === undefined
        ? {}
        : {
            actorId: input.configuration.ownerAdminId,
            actorType: "admin" as const,
            oauthClientId: authInfo.clientId,
          }),
      audience: "admin-mcp",
      durationMs,
      ...(status < 400
        ? {}
        : { errorClass: status >= 500 ? "server-error" : "client-error" }),
      method: request.method,
      outcome: status < 400 ? "succeeded" : "failed",
      path: readRoutePath(request, input.configuration.resourceUrl),
      requestId,
      status,
    })
  } catch {
    // 로그 기록 실패가 MCP 응답을 바꾸면 호출 결과와 관측 결과가 서로 달라진다.
  }
}

function logAuthenticationDenial(
  input: Pick<
    Parameters<typeof createAdminMcpRuntime>[0],
    "configuration" | "securityAuditLogger"
  >,
  request: Request,
  requestId: string,
  status: number
): void {
  try {
    input.securityAuditLogger({
      action: status === 403 ? "authorization.denied" : "authentication.failed",
      outcome: "denied",
      reasonCode: status === 403 ? "insufficient_scope" : "invalid_token",
      requestId,
      target: readRoutePath(request, input.configuration.resourceUrl),
    })
  } catch {
    // 보안 로그 기록 실패가 인증 거부 응답을 바꾸면 안 된다.
  }
}

function logSecurityDenial(
  input: Pick<
    Parameters<typeof createAdminMcpRuntime>[0],
    "configuration" | "securityAuditLogger"
  >,
  request: Request,
  requestId: string,
  reasonCode: "invalid_host" | "invalid_origin"
): void {
  try {
    input.securityAuditLogger({
      action: "authorization.denied",
      outcome: "denied",
      reasonCode,
      requestId,
      target: readRoutePath(request, input.configuration.resourceUrl),
    })
  } catch {
    // 보안 로그 기록 실패가 요청 거부 응답을 바꾸면 안 된다.
  }
}

function readRoutePath(request: Request, resourceUrl: string): string {
  const path = new URL(request.url).pathname
  const protectedResourcePath = new URL(
    getOAuthProtectedResourceMetadataUrl(new URL(resourceUrl))
  ).pathname
  if (path === protectedResourcePath) return protectedResourcePath
  if (path === "/.well-known/oauth-authorization-server") return path
  return adminMcpPath
}

function withAdminMcpResponseHeaders(
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
