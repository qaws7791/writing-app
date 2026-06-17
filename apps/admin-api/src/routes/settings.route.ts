import { Hono } from "hono"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { errorResponse } from "@/routes/error-response"
import {
  jsonBodyErrorDetail,
  parseJsonBody,
  resolveAdminSession,
  resolveOwnerAdminSession,
} from "@/routes/route-helpers"
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
    const sessionResult = await resolveOwnerAdminSession(
      context,
      sessionResolver
    )

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const parsedBody = await parseJsonBody(
      context,
      adminNoticeSettingsRequestSchema
    )

    if (parsedBody.kind === "err") {
      return context.json(
        errorResponse("invalid_request", jsonBodyErrorDetail(parsedBody.error)),
        400
      )
    }

    return context.json(
      await adminService.updateNoticeSettings({
        ...parsedBody.value,
        now: now(),
      })
    )
  })

  route.put("/legal", async (context) => {
    const sessionResult = await resolveOwnerAdminSession(
      context,
      sessionResolver
    )

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const parsedBody = await parseJsonBody(
      context,
      adminLegalSettingsRequestSchema
    )

    if (parsedBody.kind === "err") {
      return context.json(
        errorResponse("invalid_request", jsonBodyErrorDetail(parsedBody.error)),
        400
      )
    }

    return context.json(
      await adminService.updateLegalSettings({
        ...parsedBody.value,
        now: now(),
      })
    )
  })

  route.post("/content-reset", async (context) => {
    const sessionResult = await resolveOwnerAdminSession(
      context,
      sessionResolver
    )

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
