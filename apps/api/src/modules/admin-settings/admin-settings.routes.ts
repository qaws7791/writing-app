import type { AnyRouteConfig } from "@/http/platform/core"
import {
  adminLegalSettingsRequestSchema,
  adminNoticeSettingsRequestSchema,
} from "@workspace/contracts/admin"
import { adminContentResetResultSchema } from "@workspace/contracts/admin/content-data"
import { adminSettingsDtoSchema } from "@workspace/contracts/admin/settings-data"
import type { AdminSettingsUseCase } from "@workspace/core/admin"
import type { AdminContentResetUseCase } from "@workspace/core/content"

import type { AdminSessionResolver } from "@/adapters/auth/admin-session"
import {
  defineAdminRoute,
  type AdminRouteHandler,
} from "@/admin/admin-hono-env"
import { forbiddenAdminError, notFoundAdminError } from "@/admin/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonResponse,
} from "@/admin/admin-openapi"
import {
  adminSessionRouteOptions,
  ownerAdminRouteOptions,
} from "@/admin/admin-route-options"
import {
  defineAdminRouteGroup,
  type AdminRouteGroup,
} from "@/http/admin-route-group"

export type AdminSettingsRouteDependencies = {
  readonly contentResetService: AdminContentResetUseCase
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
  readonly settingsService: AdminSettingsUseCase
}

export function createAdminSettingsRoutes(
  dependencies: AdminSettingsRouteDependencies
): AdminRouteGroup {
  return defineAdminRouteGroup([
    createGetSettingsRoute(dependencies),
    createUpdateNoticeSettingsRoute(dependencies),
    createUpdateLegalSettingsRoute(dependencies),
    createResetContentRoute(dependencies),
  ])
}

function createGetSettingsRoute({
  sessionResolver,
  settingsService,
}: AdminSettingsRouteDependencies) {
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

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const response = adminSettingsDtoSchema.parse(
      await settingsService.getSettings()
    )

    return context.json(response, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createUpdateNoticeSettingsRoute({
  now,
  sessionResolver,
  settingsService,
}: AdminSettingsRouteDependencies) {
  const routeConfig = {
    method: "put",
    operationId: "updateAdminNoticeSettings",
    path: "/settings/notice",
    request: {
      body: {
        content: {
          "application/json": {
            schema: adminNoticeSettingsRequestSchema,
          },
        },
      },
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
    const response = adminSettingsDtoSchema.parse(
      unwrapAdminOwnerMutationResult(
        await settingsService.updateNoticeSettings({
          actor: context.var.adminActor,
          announce: body.announce,
          banner: body.banner,
          now: now(),
        })
      )
    )

    return context.json(response, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createUpdateLegalSettingsRoute({
  now,
  sessionResolver,
  settingsService,
}: AdminSettingsRouteDependencies) {
  const routeConfig = {
    method: "put",
    operationId: "updateAdminLegalSettings",
    path: "/settings/legal",
    request: {
      body: {
        content: {
          "application/json": {
            schema: adminLegalSettingsRequestSchema,
          },
        },
      },
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
    const response = adminSettingsDtoSchema.parse(
      unwrapAdminOwnerMutationResult(
        await settingsService.updateLegalSettings({
          actor: context.var.adminActor,
          now: now(),
          privacy: body.privacy,
          terms: body.terms,
        })
      )
    )

    return context.json(response, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createResetContentRoute({
  contentResetService,
  now,
  sessionResolver,
}: AdminSettingsRouteDependencies) {
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

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const response = adminContentResetResultSchema.parse(
      unwrapAdminOwnerMutationResult(
        await contentResetService.resetContent({
          actor: context.var.adminActor,
          now: now(),
        })
      )
    )

    return context.json(response, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function unwrapAdminOwnerMutationResult<TValue>(
  result:
    | { readonly kind: "forbidden" }
    | { readonly kind: "not-found" }
    | { readonly kind: "ok"; readonly value: TValue }
): TValue {
  switch (result.kind) {
    case "forbidden":
      throw forbiddenAdminError()
    case "not-found":
      throw notFoundAdminError()
    case "ok":
      return result.value
  }
}
