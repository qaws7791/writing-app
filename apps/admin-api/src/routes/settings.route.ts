import { Hono } from "hono"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { errorResponse } from "@/routes/error-response"
import { resolveAdminSession } from "@/routes/route-helpers"
import {
  adminLegalSettingsRequestSchema,
  adminNoticeSettingsRequestSchema,
  type AdminService,
} from "@workspace/core/admin"

export type SettingsRouteDependencies = {
  readonly adminService: AdminService
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createSettingsRoute({
  adminService,
  now,
  sessionResolver,
}: SettingsRouteDependencies): Hono {
  const route = new Hono()

  route.get("/", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    return context.json(await adminService.getSettings())
  })

  route.put("/notice", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const parsedBody = adminNoticeSettingsRequestSchema.safeParse(
      await context.req.json().catch(() => null)
    )

    if (!parsedBody.success) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    return context.json(
      await adminService.updateNoticeSettings({
        ...parsedBody.data,
        now: now(),
      })
    )
  })

  route.put("/legal", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const parsedBody = adminLegalSettingsRequestSchema.safeParse(
      await context.req.json().catch(() => null)
    )

    if (!parsedBody.success) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    return context.json(
      await adminService.updateLegalSettings({
        ...parsedBody.data,
        now: now(),
      })
    )
  })

  route.post("/content-reset", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    return context.json(
      await adminService.resetContent({
        now: now(),
      })
    )
  })

  return route
}
