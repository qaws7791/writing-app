import { Hono, type Context, type Env, type Schema } from "hono"
import { defaultRequestLoggingRuntime } from "@workspace/http-platform/app"
import { createRequestBodyLimitMiddleware } from "@workspace/http-platform/security"

import { adminRoutePrefix } from "@/http/admin-openapi"
import { adminMcpPath } from "@/mcp/admin/admin-mcp-configuration"
import type { AdminMcpRuntime } from "@/mcp/admin/admin-mcp-runtime"

type UnifiedApiEnv = {
  Variables: { readonly requestId: string }
}

export const adminMcpRequestBodyLimitBytes = 320 * 1_024

export function createUnifiedApp<
  TAdminEnv extends Env,
  TAdminSchema extends Schema,
  TLearnerEnv extends Env,
  TLearnerSchema extends Schema,
>(input: {
  readonly adminApp: Hono<TAdminEnv, TAdminSchema>
  readonly adminMcp?:
    | Readonly<{
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
    const serveAdminMcp = (context: Context<UnifiedApiEnv>) =>
      adminMcp.runtime.fetch(context.req.raw, {
        requestId: context.get("requestId"),
      })

    app.use(
      adminMcpPath,
      createRequestBodyLimitMiddleware({
        maxSize: adminMcpRequestBodyLimitBytes,
      })
    )
    app.all(adminMcpPath, serveAdminMcp)
  }

  app.route(adminRoutePrefix, input.adminApp)
  app.route("/api", input.learnerApp)

  return app
}
