import { Hono, type Context, type Env, type Schema } from "hono"
import { defaultRequestLoggingRuntime } from "@workspace/http-platform/app"
import { createRequestBodyLimitMiddleware } from "@workspace/http-platform/security"

import { adminRoutePrefix } from "@/http/admin-openapi"
import {
  adminMcpPath,
  type AdminMcpConfiguration,
} from "@/mcp/admin/admin-mcp-configuration"
import type { AdminMcpRuntime } from "@/mcp/admin/admin-mcp-runtime"

type UnifiedApiEnv = {
  Variables: { readonly requestId: string }
}

export function createUnifiedApp<
  TAdminEnv extends Env,
  TAdminSchema extends Schema,
  TLearnerEnv extends Env,
  TLearnerSchema extends Schema,
>(input: {
  readonly adminApp: Hono<TAdminEnv, TAdminSchema>
  readonly adminMcp?:
    | Readonly<{
        configuration: AdminMcpConfiguration
        runtime: AdminMcpRuntime
      }>
    | undefined
  readonly createRequestId?: () => string
  readonly learnerApp: Hono<TLearnerEnv, TLearnerSchema>
}): Hono<UnifiedApiEnv> {
  const app = new Hono<UnifiedApiEnv>()

  app.use("*", async (context, next) => {
    const requestId =
      input.createRequestId?.() ??
      defaultRequestLoggingRuntime.createRequestId()
    context.set("requestId", requestId)
    context.header("x-request-id", requestId)
    await next()
  })

  if (input.adminMcp !== undefined) {
    const adminMcp = input.adminMcp
    const protectedResourceMetadataPath = new URL(
      `/.well-known/oauth-protected-resource${adminMcpPath}`,
      adminMcp.configuration.resourceUrl
    ).pathname
    const serveAdminMcp = (context: Context<UnifiedApiEnv>) =>
      adminMcp.runtime.fetch(context.req.raw, {
        requestId: context.get("requestId"),
      })

    app.use(
      adminMcpPath,
      createRequestBodyLimitMiddleware({ maxSize: 64 * 1_024 })
    )
    app.all(adminMcpPath, serveAdminMcp)
    app.all(protectedResourceMetadataPath, serveAdminMcp)
    app.all("/.well-known/oauth-authorization-server", serveAdminMcp)
  }

  app.route(adminRoutePrefix, input.adminApp)
  app.route("/api", input.learnerApp)

  return app
}
