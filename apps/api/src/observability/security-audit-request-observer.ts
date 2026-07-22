import type { RequestObservation } from "@workspace/http-platform/request-logging"
import type { SecurityAuditLogger } from "@workspace/observability/security-audit-logger"

export function createSecurityAuditRequestObserver(
  logSecurityAudit: SecurityAuditLogger | undefined
): ((observation: RequestObservation) => void) | undefined {
  if (logSecurityAudit === undefined) return undefined

  return ({ actor, context, requestId }) => {
    const method = context.req.method
    const path = context.req.path
    const status = context.res.status
    const common = {
      ...(actor === undefined
        ? {}
        : { actorId: actor.id, actorType: actor.type }),
      requestId,
      target: `${method} ${path}`,
    } as const

    if (
      (path.startsWith("/api/auth/") || path.startsWith("/api/admin/auth/")) &&
      status >= 400
    ) {
      logSecurityAudit({
        ...common,
        action: "authentication.failed",
        outcome: "denied",
      })
      return
    }
    if (status === 429 && path.includes("ai-feedback")) {
      logSecurityAudit({
        ...common,
        action: "ai.quota.exceeded",
        outcome: "denied",
      })
      return
    }
    if (status === 401 || status === 403) {
      logSecurityAudit({
        ...common,
        action: "authorization.denied",
        outcome: "denied",
      })
      return
    }
    if (
      actor?.role === "owner" &&
      ["DELETE", "PATCH", "POST", "PUT"].includes(method)
    ) {
      logSecurityAudit({
        ...common,
        action: "owner.mutation",
        outcome: status < 400 ? "succeeded" : "failed",
      })
    }
  }
}
