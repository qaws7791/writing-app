import {
  createRoute,
  type OpenAPIHono,
  type RouteConfig,
} from "@hono/zod-openapi"
import { jsonResponse } from "@workspace/http-platform/openapi"
import {
  adminDeleteUserResultSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
  adminUserParamsSchema,
  adminUsersQuerySchema,
} from "@workspace/contracts/identity/admin-users"
import { apiErrorSchema } from "@workspace/contracts/api-error"
import { adminUpdateUserStatusRequestSchema } from "@workspace/contracts/identity/status"

import type {
  AdminUserMutationUseCase,
  AdminUserReader,
  ReadAdminUsersResult,
} from "#identity/application/identity-queries"
import type { AdminSessionResolver } from "#identity/application/identity-sessions"
import {
  adminSessionRouteOptions,
  type IdentityAdminHonoEnv,
} from "#identity/interface/http/admin-auth"
import { mapIdentityError } from "#identity/interface/http/identity-http-errors"

export type AdminIdentityRouteDependencies = Readonly<{
  sessionResolver: AdminSessionResolver
  userMutationService: AdminUserMutationUseCase
  userReader: AdminUserReader
}>

export function registerAdminIdentityRoutes<TEnv extends IdentityAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  dependencies: AdminIdentityRouteDependencies
): void {
  registerListUsersRoute(app, dependencies)
  registerGetUserRoute(app, dependencies)
  registerUpdateUserStatusRoute(app, dependencies)
  registerDeleteUserRoute(app, dependencies)
}

function registerListUsersRoute<TEnv extends IdentityAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { sessionResolver, userReader }: AdminIdentityRouteDependencies
): void {
  const routeConfig = {
    method: "get",
    operationId: "getAdminUsers",
    path: "/users",
    request: { query: adminUsersQuerySchema },
    responses: authenticatedResponses(
      jsonResponse("어드민 사용자 목록입니다.", adminUserListDtoSchema)
    ),
    summary: "어드민 사용자 목록 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies RouteConfig
  const route = createRoute(routeConfig)

  app.openapi(route, async (context) => {
    const query = context.req.valid("query")
    const result = await userReader.readUsers(query)
    return context.json(toAdminUserListResponse(result), 200)
  })
}

function registerGetUserRoute<TEnv extends IdentityAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { sessionResolver, userReader }: AdminIdentityRouteDependencies
): void {
  const routeConfig = {
    method: "get",
    operationId: "getAdminUser",
    path: "/users/{userId}",
    request: { params: adminUserParamsSchema },
    responses: {
      ...authenticatedResponses(
        jsonResponse("어드민 사용자 상세입니다.", adminUserDetailDtoSchema)
      ),
      404: errorJsonResponse("사용자를 찾을 수 없습니다."),
    },
    summary: "어드민 사용자 상세 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies RouteConfig
  const route = createRoute(routeConfig)

  app.openapi(route, async (context) => {
    const user = await userReader.readUser(context.req.valid("param"))
    if (user === null) throw mapIdentityError({ kind: "identity-not-found" })
    return context.json(adminUserDetailDtoSchema.parse(user), 200)
  })
}

function registerUpdateUserStatusRoute<TEnv extends IdentityAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { sessionResolver, userMutationService }: AdminIdentityRouteDependencies
): void {
  const routeConfig = {
    method: "patch",
    operationId: "updateAdminUserStatus",
    path: "/users/{userId}/status",
    request: {
      body: {
        content: {
          "application/json": { schema: adminUpdateUserStatusRequestSchema },
        },
      },
      params: adminUserParamsSchema,
    },
    responses: {
      ...authenticatedResponses(
        jsonResponse(
          "상태가 변경된 어드민 사용자입니다.",
          adminUserDetailDtoSchema
        )
      ),
      400: errorJsonResponse("잘못된 요청입니다."),
      404: errorJsonResponse("사용자를 찾을 수 없습니다."),
      409: errorJsonResponse("사용자 상태 변경이 충돌했습니다."),
      503: errorJsonResponse(
        "삭제 보호 기록 또는 세션 폐기를 완료할 수 없습니다."
      ),
    },
    summary: "어드민 사용자 상태 변경",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies RouteConfig
  const route = createRoute(routeConfig)

  app.openapi(route, async (context) => {
    const result = await userMutationService.updateUserStatus({
      actor: context.var.adminActor,
      ...context.req.valid("param"),
      ...context.req.valid("json"),
    })
    if (result.isErr()) throw mapIdentityError(result.error)
    return context.json(adminUserDetailDtoSchema.parse(result.value), 200)
  })
}

function registerDeleteUserRoute<TEnv extends IdentityAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { sessionResolver, userMutationService }: AdminIdentityRouteDependencies
): void {
  const routeConfig = {
    method: "delete",
    operationId: "deleteAdminUser",
    path: "/users/{userId}",
    request: { params: adminUserParamsSchema },
    responses: {
      ...authenticatedResponses(
        jsonResponse(
          "삭제 처리된 어드민 사용자 결과입니다.",
          adminDeleteUserResultSchema
        )
      ),
      404: errorJsonResponse("사용자를 찾을 수 없습니다."),
      409: errorJsonResponse("사용자 상태 변경이 충돌했습니다."),
      503: errorJsonResponse("세션 폐기를 완료할 수 없습니다."),
    },
    summary: "어드민 사용자 삭제 상태 전환",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies RouteConfig
  const route = createRoute(routeConfig)

  app.openapi(route, async (context) => {
    const result = await userMutationService.deleteUser({
      actor: context.var.adminActor,
      ...context.req.valid("param"),
    })
    if (result.isErr()) throw mapIdentityError(result.error)
    return context.json(
      adminDeleteUserResultSchema.parse({ deleted: true }),
      200
    )
  })
}

function authenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: errorJsonResponse("관리자 인증이 필요합니다."),
    403: errorJsonResponse("요청을 수행할 수 없습니다."),
  }
}

function errorJsonResponse(description: string) {
  return jsonResponse(description, apiErrorSchema)
}

function toAdminUserListResponse(result: ReadAdminUsersResult) {
  return adminUserListDtoSchema.parse({
    items: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    },
  })
}
