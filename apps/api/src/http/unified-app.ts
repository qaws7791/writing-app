import { Hono, type Env, type Schema } from "hono"
import { defaultRequestLoggingRuntime } from "@workspace/http-platform/request-logging"

import { adminRoutePrefix } from "@/admin/admin-openapi"
import {
  normalizeApiHostAuthority,
  type ApiHostConfiguration,
} from "@/config/api-hosts"

export type ApiHostRejection = {
  readonly reason: "invalid" | "mismatch" | "missing" | "unknown"
}

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
  readonly allowedHosts: ApiHostConfiguration
  readonly createRequestId?: () => string
  readonly learnerApp: Hono<TLearnerEnv, TLearnerSchema>
  readonly onRejectedHost?: (event: ApiHostRejection) => void
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

  app.use("*", async (context, next) => {
    const reason = readHostRejectionReason(context.req.raw, input.allowedHosts)
    if (reason === undefined) return next()

    try {
      input.onRejectedHost?.({ reason })
    } catch {
      // 관찰 callback 장애가 fail-closed Host 응답을 바꾸지 않게 격리한다.
    }

    return context.json(
      {
        code: "MISDIRECTED_REQUEST",
        message: "요청 대상 Host가 올바르지 않습니다.",
      },
      421,
      { "Cache-Control": "no-store" }
    )
  })

  app.route(adminRoutePrefix, input.adminApp)
  app.route("/", input.learnerApp)

  return app
}

function readHostRejectionReason(
  request: Request,
  allowedHosts: ApiHostConfiguration
): ApiHostRejection["reason"] | undefined {
  const rawHost = request.headers.get("host")
  if (rawHost === null) return "missing"

  let authority: ReturnType<typeof normalizeApiHostAuthority>
  let urlAuthority: ReturnType<typeof normalizeApiHostAuthority>
  try {
    authority = normalizeApiHostAuthority(rawHost)
    urlAuthority = normalizeApiHostAuthority(new URL(request.url).host)
  } catch {
    return "invalid"
  }

  if (authority !== urlAuthority) return "mismatch"
  if (!allowedHosts.has(authority)) return "unknown"

  return undefined
}
