import type { MiddlewareHandler } from "hono"
import { courseIdSchema } from "@workspace/contracts/content/ids"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { learnerOperationalStatusSchema } from "@workspace/contracts/identity/status"
import { AppError } from "@workspace/http-platform/errors"
import { readTrustedClientIp } from "@workspace/http-platform/security"
import type { AdminSessionResolver } from "@workspace/identity/ports"
import type {
  AuditAction,
  AuditTarget,
  AuditTrail,
} from "@workspace/operations/ports"

import type { AdminHonoEnv } from "@/http/admin-hono-env"

type AdminAuditDescriptor = Readonly<{
  action: AuditAction
  target: AuditTarget
}>

export function createAdminAuditMiddleware(input: {
  readonly auditTrail: AuditTrail
  readonly sessionResolver: AdminSessionResolver
}): MiddlewareHandler<AdminHonoEnv> {
  return async (context, next) => {
    const descriptor = await readAdminAuditDescriptor(context.req.raw)
    if (descriptor === null) {
      await next()
      return
    }

    const session = await input.sessionResolver.resolveSession(
      context.req.raw.headers
    )
    if (session === null) {
      await next()
      return
    }

    const requestId = context.get("requestId")
    const clientIp = readTrustedClientIp(context.req.raw)
    const started = await input.auditTrail.begin({
      ...descriptor,
      actorId: session.admin.id,
      clientIp: clientIp === "unknown" ? null : clientIp,
      requestId,
    })
    if (started.isErr()) throw auditWriteFailedError()

    try {
      await next()
    } catch (cause) {
      const completed = await input.auditTrail.complete({
        eventId: started.value.id,
        outcome: "failed",
      })
      if (completed.isErr()) throw auditWriteFailedError()
      throw cause
    }

    const completed = await input.auditTrail.complete({
      eventId: started.value.id,
      outcome:
        context.res.status >= 200 && context.res.status < 300
          ? "succeeded"
          : "failed",
    })
    if (completed.isErr()) throw auditWriteFailedError()
  }
}

async function readAdminAuditDescriptor(
  request: Request
): Promise<AdminAuditDescriptor | null> {
  const segments = readAdminPathSegments(new URL(request.url).pathname)

  if (segments[0] === "users" && segments.length === 2) {
    const userId = userIdSchema.safeParse(segments[1])
    if (!userId.success) return null

    if (request.method === "GET") {
      return {
        action: "learner.detail.read",
        target: { id: userId.data, type: "learner" },
      }
    }
    if (request.method === "DELETE") {
      return {
        action: "learner.delete",
        target: { id: userId.data, type: "learner" },
      }
    }
  }

  if (
    request.method === "PATCH" &&
    segments[0] === "users" &&
    segments[2] === "status" &&
    segments.length === 3
  ) {
    const userId = userIdSchema.safeParse(segments[1])
    if (!userId.success) return null

    const status = learnerOperationalStatusSchema.safeParse(
      await readStatus(request)
    )
    if (!status.success) return null

    return {
      action:
        status.data === "active"
          ? "learner.status.activate"
          : "learner.status.suspend",
      target: { id: userId.data, type: "learner" },
    }
  }

  if (segments[0] === "courses" && segments.length === 2) {
    const courseId = courseIdSchema.safeParse(segments[1])
    if (request.method !== "DELETE" || !courseId.success) return null
    return {
      action: "course.archive",
      target: { id: courseId.data, type: "course" },
    }
  }

  if (
    request.method === "POST" &&
    segments[0] === "courses" &&
    segments.length === 3 &&
    (segments[2] === "publish" || segments[2] === "restore")
  ) {
    const courseId = courseIdSchema.safeParse(segments[1])
    if (!courseId.success) return null
    return {
      action: segments[2] === "publish" ? "course.publish" : "course.restore",
      target: { id: courseId.data, type: "course" },
    }
  }

  return null
}

function readAdminPathSegments(path: string): readonly string[] {
  const normalizedPath = path.startsWith("/api/admin/")
    ? path.slice("/api/admin".length)
    : path
  return normalizedPath.split("/").filter((segment) => segment.length > 0)
}

async function readStatus(request: Request): Promise<unknown> {
  try {
    const value: unknown = await request.clone().json()
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? Reflect.get(value, "status")
      : undefined
  } catch {
    return undefined
  }
}

function auditWriteFailedError(): AppError {
  return new AppError({
    code: "AUDIT_WRITE_FAILED",
    message: "Audit trail is unavailable",
    status: 503,
  })
}
