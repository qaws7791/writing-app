import type { AnyRouteConfig } from "@workspace/hono/core"
import { z } from "@workspace/hono/zod"

import type { AdminMfaRecoveryService } from "@/auth/admin-mfa-recovery"
import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { unauthorizedAdminError } from "@/errors/admin-errors"
import {
  errorJsonResponse,
  jsonRequestBody,
  jsonResponse,
} from "@/http/openapi"
import { ownerAdminRouteOptions } from "@/routes/admin-route-options"

const recoveryCodesResponseSchema = z.object({
  recoveryCodes: z.array(z.string()).length(10),
})
const recoverRequestSchema = z.object({
  code: z.string().length(35),
  email: z.email(),
  password: z.string().min(1).max(200),
})
const recoveredResponseSchema = z.object({ recovered: z.literal(true) })

export function createAdminMfaRoutes({
  recoveryService,
  sessionResolver,
}: {
  readonly recoveryService: AdminMfaRecoveryService
  readonly sessionResolver: AdminSessionResolver
}) {
  return [
    createRecoveryCodesRoute(recoveryService, sessionResolver),
    createRecoverRoute(recoveryService),
  ] as const
}

function createRecoveryCodesRoute(
  recoveryService: AdminMfaRecoveryService,
  sessionResolver: AdminSessionResolver
) {
  const routeConfig = {
    method: "post",
    operationId: "replaceAdminMfaRecoveryCodes",
    path: "/mfa/recovery-codes",
    responses: {
      200: jsonResponse("새 MFA 복구 코드입니다.", recoveryCodesResponseSchema),
      403: errorJsonResponse("MFA 등록 또는 최근 인증이 필요합니다."),
    },
    summary: "관리자 MFA 복구 코드 재발급",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const recoveryCodes = await recoveryService.replaceRecoveryCodes(
      context.var.adminActor.id
    )
    return context.json({ recoveryCodes: [...recoveryCodes] }, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createRecoverRoute(recoveryService: AdminMfaRecoveryService) {
  const routeConfig = {
    method: "post",
    operationId: "recoverAdminMfa",
    path: "/mfa/recover",
    request: { body: jsonRequestBody(recoverRequestSchema) },
    responses: {
      200: jsonResponse("MFA 복구가 완료되었습니다.", recoveredResponseSchema),
      401: errorJsonResponse("복구 정보를 확인할 수 없습니다."),
    },
    summary: "관리자 MFA 복구",
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const recovered = await recoveryService.recover(context.req.valid("json"))
    if (!recovered) throw unauthorizedAdminError()
    return context.json({ recovered: true as const }, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}
