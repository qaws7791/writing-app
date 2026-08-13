import {
  createRoute,
  type OpenAPIHono,
  type RouteConfig,
} from "@hono/zod-openapi"
import { jsonResponse } from "@workspace/http-platform/openapi"
import { apiErrorSchema } from "@workspace/contracts/api-error"
import {
  adminPublishWritingTaskResultSchema,
  adminWritingTaskEditorDocumentSchema,
  adminWritingTaskIfMatchHeadersSchema,
  adminWritingTaskListDtoSchema,
  adminWritingTaskParamsSchema,
  adminWritingTaskWriteDocumentSchema,
  adminWritingTasksQuerySchema,
} from "@workspace/contracts/writing/admin-writing-tasks"

import type { WritingAdminApplication } from "#writing/application/ports/writing-ports"
import { AppError } from "@workspace/http-platform/errors"
import {
  writingAdminSessionRouteOptions,
  type WritingAdminHonoEnv,
  type WritingAdminSessionPort,
} from "#writing/interface/http/writing-admin-auth"
import {
  parseIntegerEtag,
  toIntegerEtag,
} from "#writing/interface/http/writing-etag"
import {
  presentWritingTask,
  presentWritingTaskListItem,
  unwrapWritingResult,
} from "#writing/interface/http/writing-http-mapper"

export function registerWritingAdminRoutes<TEnv extends WritingAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: {
    readonly application: WritingAdminApplication
    readonly sessionPort: WritingAdminSessionPort
  }
): void {
  registerListWritingTasksRoute(app, input)
  registerCreateWritingTaskRoute(app, input)
  registerGetWritingTaskRoute(app, input)
  registerSaveWritingTaskRoute(app, input)
  registerPublishWritingTaskRoute(app, input)
}

function registerListWritingTasksRoute<TEnv extends WritingAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { application, sessionPort }: AdminWritingRouteDependencies
): void {
  const route = createRoute({
    method: "get",
    operationId: "getAdminWritingTasks",
    path: "/writing-tasks",
    request: { query: adminWritingTasksQuerySchema },
    responses: authenticatedAdminResponses(
      jsonResponse("쓰기 과제 목록입니다.", adminWritingTaskListDtoSchema)
    ),
    summary: "쓰기 과제 목록",
    ...writingAdminSessionRouteOptions(sessionPort),
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const query = context.req.valid("query")
    const page = await application.listTasks({
      page: query.page,
      pageSize: query.pageSize,
      query: query.query,
      status: query.status,
      ...(query.domain === undefined ? {} : { domain: query.domain }),
    })
    const totalPages = Math.max(1, Math.ceil(page.totalItems / page.pageSize))
    return context.json(
      adminWritingTaskListDtoSchema.parse({
        items: page.items.map(presentWritingTaskListItem),
        pagination: {
          page: page.page,
          pageSize: page.pageSize,
          totalItems: page.totalItems,
          totalPages,
        },
      }),
      200
    )
  })
}

function registerCreateWritingTaskRoute<TEnv extends WritingAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { application, sessionPort }: AdminWritingRouteDependencies
): void {
  const route = createRoute({
    method: "post",
    operationId: "createAdminWritingTask",
    path: "/writing-tasks",
    responses: authenticatedAdminResponses(
      jsonResponse(
        "새 쓰기 과제 초안입니다.",
        adminWritingTaskEditorDocumentSchema
      )
    ),
    summary: "쓰기 과제 생성",
    ...writingAdminSessionRouteOptions(sessionPort),
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const draft = await application.createTask()
    return context.json(
      adminWritingTaskEditorDocumentSchema.parse(presentWritingTask(draft)),
      200,
      { ETag: toIntegerEtag(draft.editVersion) }
    )
  })
}

function registerGetWritingTaskRoute<TEnv extends WritingAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { application, sessionPort }: AdminWritingRouteDependencies
): void {
  const route = createRoute({
    method: "get",
    operationId: "getAdminWritingTask",
    path: "/writing-tasks/{writingTaskId}",
    request: { params: adminWritingTaskParamsSchema },
    responses: {
      ...authenticatedAdminResponses(
        jsonResponse(
          "쓰기 과제 초안입니다.",
          adminWritingTaskEditorDocumentSchema
        )
      ),
      404: adminErrorJsonResponse("과제를 찾을 수 없습니다."),
    },
    summary: "쓰기 과제 조회",
    ...writingAdminSessionRouteOptions(sessionPort),
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const draft = unwrapWritingResult(
      await application.getTask(context.req.valid("param").writingTaskId)
    )
    return context.json(
      adminWritingTaskEditorDocumentSchema.parse(presentWritingTask(draft)),
      200,
      { ETag: toIntegerEtag(draft.editVersion) }
    )
  })
}

function registerSaveWritingTaskRoute<TEnv extends WritingAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { application, sessionPort }: AdminWritingRouteDependencies
): void {
  const route = createRoute({
    method: "put",
    operationId: "saveAdminWritingTask",
    path: "/writing-tasks/{writingTaskId}",
    request: {
      headers: adminWritingTaskIfMatchHeadersSchema,
      params: adminWritingTaskParamsSchema,
      body: {
        content: {
          "application/json": { schema: adminWritingTaskWriteDocumentSchema },
        },
        required: true,
      },
    },
    responses: {
      ...authenticatedAdminResponses(
        jsonResponse(
          "저장한 쓰기 과제 초안입니다.",
          adminWritingTaskEditorDocumentSchema
        )
      ),
      400: adminErrorJsonResponse("If-Match 형식이 유효하지 않습니다."),
      404: adminErrorJsonResponse("과제를 찾을 수 없습니다."),
      409: adminErrorJsonResponse("과제 version이 충돌했습니다."),
      428: adminErrorJsonResponse("If-Match draft version이 필요합니다."),
    },
    summary: "쓰기 과제 초안 저장",
    ...writingAdminSessionRouteOptions(sessionPort),
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const expectedEditVersion = readExpectedEditVersion(
      context.req.valid("header")["if-match"]
    )
    const body = context.req.valid("json")
    const draft = unwrapWritingResult(
      await application.saveTask({
        audience: body.audience,
        difficulty: body.difficulty,
        domain: body.domain,
        expectedEditVersion,
        goalChars: body.goalChars,
        minChars: body.minChars,
        requiredElements: body.requiredElements,
        situation: body.situation,
        taskId: context.req.valid("param").writingTaskId,
        title: body.title,
        typeName: body.typeName,
      })
    )
    return context.json(
      adminWritingTaskEditorDocumentSchema.parse(presentWritingTask(draft)),
      200,
      { ETag: toIntegerEtag(draft.editVersion) }
    )
  })
}

function registerPublishWritingTaskRoute<TEnv extends WritingAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { application, sessionPort }: AdminWritingRouteDependencies
): void {
  const route = createRoute({
    method: "post",
    operationId: "publishAdminWritingTask",
    path: "/writing-tasks/{writingTaskId}/publish",
    request: {
      headers: adminWritingTaskIfMatchHeadersSchema,
      params: adminWritingTaskParamsSchema,
    },
    responses: {
      ...authenticatedAdminResponses(
        jsonResponse(
          "발행한 쓰기 과제입니다.",
          adminPublishWritingTaskResultSchema
        )
      ),
      400: adminErrorJsonResponse("If-Match 형식이 유효하지 않습니다."),
      404: adminErrorJsonResponse("과제를 찾을 수 없습니다."),
      409: adminErrorJsonResponse("과제를 발행할 수 없습니다."),
      428: adminErrorJsonResponse("If-Match draft version이 필요합니다."),
    },
    summary: "쓰기 과제 발행",
    ...writingAdminSessionRouteOptions(sessionPort),
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const expectedEditVersion = readExpectedEditVersion(
      context.req.valid("header")["if-match"]
    )
    const published = unwrapWritingResult(
      await application.publishTask({
        expectedEditVersion,
        taskId: context.req.valid("param").writingTaskId,
      })
    )
    return context.json(
      adminPublishWritingTaskResultSchema.parse({
        editVersion: published.draft.editVersion,
        publicationId: published.publication.id,
        publishedAt: published.publication.publishedAt.toISOString(),
      }),
      200,
      { ETag: toIntegerEtag(published.draft.editVersion) }
    )
  })
}

type AdminWritingRouteDependencies = Readonly<{
  application: WritingAdminApplication
  sessionPort: WritingAdminSessionPort
}>

function readExpectedEditVersion(ifMatch: string | undefined): number {
  if (ifMatch === undefined || ifMatch.trim().length === 0) {
    throw new AppError({
      code: "PRECONDITION_REQUIRED",
      message: "If-Match draft version이 필요합니다.",
      status: 428,
    })
  }
  const version = parseIntegerEtag(ifMatch)
  if (version === null) {
    throw new AppError({
      code: "VALIDATION_FAILED",
      message: "If-Match 형식이 유효하지 않습니다.",
      status: 400,
    })
  }
  return version
}

function authenticatedAdminResponses(success: ReturnType<typeof jsonResponse>) {
  return {
    200: success,
    401: adminErrorJsonResponse("관리자 인증이 필요합니다."),
  }
}

function adminErrorJsonResponse(description: string) {
  return jsonResponse(description, apiErrorSchema)
}
