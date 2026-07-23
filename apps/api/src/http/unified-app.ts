import { Hono, type Env, type Schema } from "hono"
import { defaultRequestLoggingRuntime } from "@workspace/http-platform/request-logging"

import { adminRoutePrefix } from "@/admin/admin-openapi"

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

  app.route(adminRoutePrefix, input.adminApp)
  app.route("/api", input.learnerApp)

  return app
}
