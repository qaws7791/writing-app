import type { Context, MiddlewareHandler } from "hono"

import type {
  RequestAudience,
  RequestLogger,
} from "@workspace/observability/request-logger"
import type { HttpRequestActor } from "#http-platform/context"

export type RequestObservation = {
  readonly actor: HttpRequestActor | undefined
  readonly context: Context
  readonly requestId: string
}

export type RequestLoggingMiddlewareOptions = {
  readonly audience: RequestAudience
  readonly createRequestId?: () => string
  readonly logRequest: RequestLogger
  readonly observeRequest?: (observation: RequestObservation) => void
  readonly readActor?: (context: Context) => HttpRequestActor | undefined
  readonly readMonotonicTimeMs?: () => number
}

export type RequestLoggingRuntime = {
  readonly createRequestId: () => string
  readonly readMonotonicTimeMs: () => number
}

export const defaultRequestLoggingRuntime = {
  createRequestId: createDefaultRequestId,
  readMonotonicTimeMs: readDefaultMonotonicTimeMs,
} as const satisfies RequestLoggingRuntime

export function createRequestLoggingMiddleware({
  audience,
  createRequestId = defaultRequestLoggingRuntime.createRequestId,
  logRequest,
  observeRequest,
  readActor,
  readMonotonicTimeMs = defaultRequestLoggingRuntime.readMonotonicTimeMs,
}: RequestLoggingMiddlewareOptions): MiddlewareHandler {
  return async (context, next) => {
    const startedAt = readMonotonicTimeMs()
    const currentRequestId = context.get("requestId")
    const requestId =
      typeof currentRequestId === "string" && currentRequestId.length > 0
        ? currentRequestId
        : createRequestId()
    const externalRequestId = normalizeExternalRequestId(
      context.req.header("x-request-id")
    )

    context.header("x-request-id", requestId)
    context.set("requestId", requestId)

    try {
      await next()
    } finally {
      const actor = readActor?.(context) ?? context.get("requestActor")
      const classification = classifyRequestResult(context.res.status)
      logRequest({
        ...(actor === undefined
          ? {}
          : { actorId: actor.id, actorType: actor.type }),
        audience,
        durationMs: Math.max(0, Math.round(readMonotonicTimeMs() - startedAt)),
        ...(externalRequestId === undefined ? {} : { externalRequestId }),
        method: context.req.method,
        ...classification,
        path: context.req.path,
        requestId,
        status: context.res.status,
      })
      observeRequest?.({ actor, context, requestId })
    }
  }
}

function classifyRequestResult(status: number): Readonly<{
  errorClass?: "client-error" | "server-error"
  outcome: "failed" | "succeeded"
}> {
  if (status < 400) return { outcome: "succeeded" }
  return {
    errorClass: status < 500 ? "client-error" : "server-error",
    outcome: "failed",
  }
}

export function normalizeExternalRequestId(
  value: string | undefined
): string | undefined {
  if (value === undefined || value.length === 0 || value.length > 128) {
    return undefined
  }

  return /^[A-Za-z0-9._:-]+$/.test(value) ? value : undefined
}

function createDefaultRequestId(): string {
  return crypto.randomUUID()
}

function readDefaultMonotonicTimeMs(): number {
  return performance.now()
}
