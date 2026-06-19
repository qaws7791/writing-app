import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminContentResetResultSchema,
  adminLegalSettingsRequestSchema,
  adminNoticeSettingsRequestSchema,
  adminSettingsDtoSchema,
} from "@workspace/contracts/admin"
import type {
  AdminContentResetUseCase,
  AdminSettingsUseCase,
} from "@workspace/core/admin"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonRequestBody,
  jsonResponse,
} from "@/http/openapi"
import {
  adminSessionRouteOptions,
  ownerAdminRouteOptions,
} from "@/routes/admin-route-options"

export type SettingsRouteDependencies = {
  readonly contentResetService: AdminContentResetUseCase
  readonly now: () => Date
  readonly settingsService: AdminSettingsUseCase
  readonly sessionResolver: AdminSessionResolver
}

export function createSettingsRoutes(dependencies: SettingsRouteDependencies) {
  return [
    createGetSettingsRoute(dependencies),
    createUpdateNoticeSettingsRoute(dependencies),
    createUpdateLegalSettingsRoute(dependencies),
    createResetContentRoute(dependencies),
  ] as const
}

function createGetSettingsRoute({
  settingsService,
  sessionResolver,
}: SettingsRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminSettings",
    path: "/settings",
    responses: adminAuthenticatedResponses(
      jsonResponse("어드민 운영 설정입니다.", adminSettingsDtoSchema)
    ),
    summary: "어드민 운영 설정 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(await settingsService.getSettings(), 200)

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createUpdateNoticeSettingsRoute({
  now,
  settingsService,
  sessionResolver,
}: SettingsRouteDependencies) {
  const routeConfig = {
    method: "put",
    operationId: "updateAdminNoticeSettings",
    path: "/settings/notice",
    request: {
      body: jsonRequestBody(adminNoticeSettingsRequestSchema),
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse("저장된 어드민 운영 설정입니다.", adminSettingsDtoSchema)
      ),
      400: errorJsonResponse("잘못된 요청입니다."),
    },
    summary: "어드민 공지 설정 저장",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const body = context.req.valid("json")

    return context.json(
      await settingsService.updateNoticeSettings({
        ...body,
        now: now(),
      }),
      200
    )
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createUpdateLegalSettingsRoute({
  now,
  settingsService,
  sessionResolver,
}: SettingsRouteDependencies) {
  const routeConfig = {
    method: "put",
    operationId: "updateAdminLegalSettings",
    path: "/settings/legal",
    request: {
      body: jsonRequestBody(adminLegalSettingsRequestSchema),
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse("저장된 어드민 운영 설정입니다.", adminSettingsDtoSchema)
      ),
      400: errorJsonResponse("잘못된 요청입니다."),
    },
    summary: "어드민 법적 문서 설정 저장",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const body = context.req.valid("json")

    return context.json(
      await settingsService.updateLegalSettings({
        ...body,
        now: now(),
      }),
      200
    )
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createResetContentRoute({
  contentResetService,
  now,
  sessionResolver,
}: SettingsRouteDependencies) {
  const routeConfig = {
    method: "post",
    operationId: "resetAdminContent",
    path: "/settings/content-reset",
    responses: adminAuthenticatedResponses(
      jsonResponse("콘텐츠 초기화 결과입니다.", adminContentResetResultSchema)
    ),
    summary: "어드민 콘텐츠 초기화",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(
      await contentResetService.resetContent({
        now: now(),
      }),
      200
    )

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}
