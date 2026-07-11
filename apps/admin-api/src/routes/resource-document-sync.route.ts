import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminReadResourceDocumentSyncQuerySchema,
  adminReadResourceDocumentSyncResponseSchema,
  adminSaveResourceDocumentTransactionRequestSchema,
  adminSaveResourceDocumentTransactionResponseSchema,
} from "@workspace/contracts/admin"
import {
  toResourceDocumentId,
  toResourceDocumentTransactionId,
  type ResourceDocumentSyncUseCase,
} from "@workspace/core/modules/resource-library/api"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import type { ResourceEventsHub } from "@/collaboration/resource-events-hub"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import {
  invalidAdminRequestError,
  notFoundAdminError,
  resourceCollaborationUnavailableAdminError,
} from "@/errors/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonRequestBody,
  jsonResponse,
} from "@/http/openapi"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"
import type { ResourceDocumentOperationCoordinator } from "@/resource-library/resource-document-operation-coordinator"

const resourceDocumentSyncParamsSchema = z.object({
  documentId: z.string().trim().min(1),
})

export function createResourceDocumentSyncRoutes(input: {
  readonly events: Pick<ResourceEventsHub, "publishDocumentVersion">
  readonly documentOperations: ResourceDocumentOperationCoordinator
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
  readonly syncService: ResourceDocumentSyncUseCase
}) {
  const readRoute = createReadResourceDocumentSyncRoute(input)
  const saveRoute = createSaveResourceDocumentTransactionRoute(input)

  return [readRoute, saveRoute] as const
}

type ResourceDocumentSyncRouteInput = {
  readonly documentOperations: ResourceDocumentOperationCoordinator
  readonly events: Pick<ResourceEventsHub, "publishDocumentVersion">
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
  readonly syncService: ResourceDocumentSyncUseCase
}

function createSaveResourceDocumentTransactionRoute(
  input: ResourceDocumentSyncRouteInput
) {
  const routeConfig = {
    method: "post",
    operationId: "saveAdminResourceDocumentTransaction",
    path: "/resources/documents/{documentId}/transactions",
    request: {
      body: jsonRequestBody(adminSaveResourceDocumentTransactionRequestSchema),
      params: resourceDocumentSyncParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "승인된 자료 문서 transaction입니다.",
          adminSaveResourceDocumentTransactionResponseSchema
        )
      ),
      400: errorJsonResponse("유효하지 않은 자료 문서 update입니다."),
      404: errorJsonResponse("활성 자료 문서를 찾을 수 없습니다."),
      503: errorJsonResponse(
        "자료 문서 저장을 일시적으로 완료하지 못했습니다."
      ),
    },
    summary: "자료 문서 transaction 저장",
    ...adminSessionRouteOptions(input.sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const body = context.req.valid("json")
    const documentId = context.req.valid("param").documentId
    const update = Uint8Array.from(Buffer.from(body.updateBase64, "base64"))

    if (update.byteLength > 512 * 1024) throw invalidAdminRequestError()

    const result = await input.documentOperations.run(documentId, () =>
      input.syncService.saveTransaction({
        actorId: context.get("activeAdminSession").admin.id,
        documentId: toResourceDocumentId(documentId),
        knownStateVersion: body.knownStateVersion,
        now: input.now(),
        transactionId: toResourceDocumentTransactionId(body.transactionId),
        update,
      })
    )

    if (result.kind === "not-found" || result.kind === "inactive") {
      throw notFoundAdminError()
    }
    if (result.kind === "invalid-state" || result.kind === "update-too-large") {
      throw invalidAdminRequestError()
    }
    if (result.kind === "stale-state-version") {
      throw resourceCollaborationUnavailableAdminError()
    }

    if (result.kind === "accepted") {
      input.events.publishDocumentVersion({
        contentRevision: result.contentRevision,
        documentId,
        stateVersion: result.stateVersion,
        type: "resource-document-version-advanced",
      })
    }

    return context.json(result, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createReadResourceDocumentSyncRoute(
  input: ResourceDocumentSyncRouteInput
) {
  const routeConfig = {
    method: "get",
    operationId: "readAdminResourceDocumentSync",
    path: "/resources/documents/{documentId}/sync",
    request: {
      params: resourceDocumentSyncParamsSchema,
      query: adminReadResourceDocumentSyncQuerySchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "자료 문서의 누락 update 또는 최신 snapshot입니다.",
          adminReadResourceDocumentSyncResponseSchema
        )
      ),
      404: errorJsonResponse("활성 자료 문서를 찾을 수 없습니다."),
    },
    summary: "자료 문서 누락 변경 조회",
    ...adminSessionRouteOptions(input.sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const query = context.req.valid("query")
    const documentId = context.req.valid("param").documentId
    const result = await input.documentOperations.run(documentId, () =>
      input.syncService.readSync({
        afterStateVersion: query.afterStateVersion,
        documentId: toResourceDocumentId(documentId),
        mode: query.mode,
      })
    )

    if (result.kind === "not-found" || result.kind === "inactive") {
      throw notFoundAdminError()
    }
    if (result.kind === "up-to-date") return context.json(result, 200)
    if (result.kind === "snapshot") {
      return context.json(
        {
          kind: result.kind,
          snapshotBase64: Buffer.from(result.snapshot).toString("base64"),
          stateVersion: result.stateVersion,
        },
        200
      )
    }

    return context.json(
      {
        fromStateVersion: result.fromStateVersion,
        kind: result.kind,
        stateVersion: result.stateVersion,
        updatesBase64: result.updates.map((update) =>
          Buffer.from(update).toString("base64")
        ),
      },
      200
    )
  }

  return defineAdminRoute({ ...routeConfig, handler })
}
