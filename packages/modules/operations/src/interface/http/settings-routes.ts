import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { jsonResponse } from "@workspace/http-platform/openapi"
import {
  adminLegalSettingsRequestSchema,
  adminNoticeSettingsRequestSchema,
  adminSettingsDtoSchema,
} from "@workspace/contracts/operations/admin-settings"

import type { OperationsSettingsApplication } from "#operations/application/operations-settings"
import type {
  OperationsAdminSessionPort,
  OperationsSecurityAuditPort,
} from "#operations/application/ports/operations-ports"
import { operationsSessionRouteOptions } from "#operations/interface/http/operations-http-auth"
import {
  defineOperationsRoute,
  mapOperationsError,
  operationsAuthenticatedResponses,
  operationsErrorResponse,
  type OperationsRouteHandler,
} from "#operations/interface/http/operations-http-support"

export function createOperationsSettingsRoutes(input: {
  readonly application: OperationsSettingsApplication
  readonly audit: OperationsSecurityAuditPort
  readonly now: () => Date
  readonly session: OperationsAdminSessionPort
}) {
  return Object.freeze([
    createReadSettingsRoute(input),
    createUpdateNoticeRoute(input),
    createUpdateLegalRoute(input),
  ])
}

function createReadSettingsRoute(
  input: Parameters<typeof createOperationsSettingsRoutes>[0]
) {
  const route = {
    method: "get",
    operationId: "getAdminSettings",
    path: "/settings",
    responses: operationsAuthenticatedResponses(
      jsonResponse("어드민 운영 설정입니다.", adminSettingsDtoSchema)
    ),
    summary: "어드민 운영 설정 조회",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const result = await input.application.queries.read()
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(adminSettingsDtoSchema.parse(result.value), 200)
  }
  return defineOperationsRoute({ ...route, handler })
}

function createUpdateNoticeRoute(
  input: Parameters<typeof createOperationsSettingsRoutes>[0]
) {
  const route = {
    method: "put",
    operationId: "updateAdminNoticeSettings",
    path: "/settings/notice",
    request: {
      body: {
        content: {
          "application/json": { schema: adminNoticeSettingsRequestSchema },
        },
      },
    },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse("저장된 어드민 운영 설정입니다.", adminSettingsDtoSchema)
      ),
      400: operationsErrorResponse("잘못된 요청입니다."),
    },
    summary: "어드민 공지 설정 저장",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const actor = context.get("operationsActor")
    const result = await input.application.noticeCommands.update({
      actor,
      document: context.req.valid("json"),
      now: input.now(),
    })
    auditOwnerMutation(
      input,
      context.get("requestId"),
      actor.id,
      result.isOk(),
      "notice"
    )
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(adminSettingsDtoSchema.parse(result.value), 200)
  }
  return defineOperationsRoute({ ...route, handler })
}

function createUpdateLegalRoute(
  input: Parameters<typeof createOperationsSettingsRoutes>[0]
) {
  const route = {
    method: "put",
    operationId: "updateAdminLegalSettings",
    path: "/settings/legal",
    request: {
      body: {
        content: {
          "application/json": { schema: adminLegalSettingsRequestSchema },
        },
      },
    },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse("저장된 어드민 운영 설정입니다.", adminSettingsDtoSchema)
      ),
      400: operationsErrorResponse("잘못된 요청입니다."),
    },
    summary: "어드민 법적 문서 설정 저장",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const actor = context.get("operationsActor")
    const result = await input.application.legalCommands.update({
      actor,
      document: context.req.valid("json"),
      now: input.now(),
    })
    auditOwnerMutation(
      input,
      context.get("requestId"),
      actor.id,
      result.isOk(),
      "legal"
    )
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(adminSettingsDtoSchema.parse(result.value), 200)
  }
  return defineOperationsRoute({ ...route, handler })
}

function auditOwnerMutation(
  input: Pick<Parameters<typeof createOperationsSettingsRoutes>[0], "audit">,
  requestId: string,
  actorId: Parameters<OperationsSecurityAuditPort>[0]["actorId"],
  succeeded: boolean,
  target: string
) {
  input.audit({
    action: "owner.mutation",
    actorId,
    outcome: succeeded ? "succeeded" : "denied",
    requestId: requestId ?? "untracked",
    target: `operations.settings.${target}`,
  })
}
