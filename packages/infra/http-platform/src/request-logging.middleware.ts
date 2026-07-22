import type { Context, MiddlewareHandler } from "hono"

import type {
  RequestAudience,
  RequestLogger,
} from "@workspace/observability/request-logger"

export type RequestActor = {
  readonly id: string
  readonly role?: string
  readonly type: "admin" | "learner"
}

export type RequestObservation = {
  readonly actor: RequestActor | undefined
  readonly context: Context
  readonly requestId: string
}

export type RequestLoggingMiddlewareOptions = {
  readonly audience: RequestAudience
  readonly createRequestId?: () => string
  readonly logRequest: RequestLogger
  readonly observeRequest?: (observation: RequestObservation) => void
  readonly readActor?: (context: Context) => RequestActor | undefined
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
    const requestId = createRequestId()
    const externalRequestId = normalizeExternalRequestId(
      context.req.header("x-request-id")
    )

    context.header("x-request-id", requestId)
    context.set("requestId", requestId)

    try {
      await next()
    } finally {
      const actor = readActor?.(context)
      logRequest({
        ...(actor === undefined
          ? {}
          : { actorId: actor.id, actorType: actor.type }),
        audience,
        durationMs: Math.max(0, Math.round(readMonotonicTimeMs() - startedAt)),
        ...(externalRequestId === undefined ? {} : { externalRequestId }),
        method: context.req.method,
        path: context.req.path,
        requestId,
        status: context.res.status,
      })
      observeRequest?.({ actor, context, requestId })
    }
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
