import type { Context, MiddlewareHandler } from "hono"

import type { SecurityAuditLogger } from "@workspace/logger/security-audit-logger"
import type { RequestLogger } from "@workspace/logger/request-logger"

export type RequestActor = {
  readonly id: string
  readonly role?: string
  readonly type: "admin" | "learner"
}

export type RequestLoggingMiddlewareOptions = {
  readonly createRequestId?: () => string
  readonly logSecurityAudit?: SecurityAuditLogger
  readonly logRequest: RequestLogger
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
  createRequestId = defaultRequestLoggingRuntime.createRequestId,
  logSecurityAudit,
  logRequest,
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
        durationMs: Math.max(0, Math.round(readMonotonicTimeMs() - startedAt)),
        ...(externalRequestId === undefined ? {} : { externalRequestId }),
        method: context.req.method,
        path: context.req.path,
        requestId,
        status: context.res.status,
      })
      logSecurityEvent({ actor, context, logSecurityAudit, requestId })
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

function logSecurityEvent(input: {
  readonly actor: RequestActor | undefined
  readonly context: Context
  readonly logSecurityAudit: SecurityAuditLogger | undefined
  readonly requestId: string
}): void {
  if (input.logSecurityAudit === undefined) return

  const method = input.context.req.method
  const path = input.context.req.path
  const status = input.context.res.status
  const common = {
    ...(input.actor === undefined
      ? {}
      : { actorId: input.actor.id, actorType: input.actor.type }),
    requestId: input.requestId,
    target: `${method} ${path}`,
  } as const

  if (path.startsWith("/api/auth/") && status >= 400) {
    input.logSecurityAudit({
      ...common,
      action: "authentication.failed",
      outcome: "denied",
    })
    return
  }

  if (status === 429 && path.includes("ai-feedback")) {
    input.logSecurityAudit({
      ...common,
      action: "ai.quota.exceeded",
      outcome: "denied",
    })
    return
  }

  if (status === 401 || status === 403) {
    input.logSecurityAudit({
      ...common,
      action: "authorization.denied",
      outcome: "denied",
    })
    return
  }

  if (
    input.actor?.role === "owner" &&
    ["DELETE", "PATCH", "POST", "PUT"].includes(method)
  ) {
    input.logSecurityAudit({
      ...common,
      action: "owner.mutation",
      outcome: status < 400 ? "succeeded" : "failed",
    })
  }
}

function createDefaultRequestId(): string {
  return crypto.randomUUID()
}

function readDefaultMonotonicTimeMs(): number {
  return performance.now()
}
