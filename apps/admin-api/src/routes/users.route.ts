import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminDeleteUserResultSchema,
  adminUpdateUserStatusRequestSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
  adminUserListStatusFilterSchema,
  adminUserSortSchema,
  userIdSchema,
} from "@workspace/contracts/admin"
import type { AdminUserUseCase } from "@workspace/core/admin"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import {
  notFoundAdminError,
  unwrapAdminOwnerMutationResult,
} from "@/errors/admin-errors"
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
import { positiveIntegerQuery } from "@/routes/query-schemas"

const defaultPage = 1
const defaultPageSize = 20
const maxPageSize = 100

const usersQuerySchema = z.object({
  page: positiveIntegerQuery({
    fallback: defaultPage,
  }),
  pageSize: positiveIntegerQuery({
    fallback: defaultPageSize,
    max: maxPageSize,
  }),
  query: z.string().optional().default(""),
  sort: adminUserSortSchema.optional().default("lastActive"),
  status: adminUserListStatusFilterSchema.optional().default("all"),
})

const userParamsSchema = z.object({
  userId: userIdSchema,
})

export type UsersRouteDependencies = {
  readonly userService: AdminUserUseCase
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createUsersRoutes(dependencies: UsersRouteDependencies) {
  return [
    createListUsersRoute(dependencies),
    createGetUserRoute(dependencies),
    createUpdateUserStatusRoute(dependencies),
    createDeleteUserRoute(dependencies),
  ] as const
}

function createListUsersRoute({
  userService,
  sessionResolver,
}: UsersRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminUsers",
    path: "/users",
    request: {
      query: usersQuerySchema,
    },
    responses: adminAuthenticatedResponses(
      jsonResponse("어드민 사용자 목록입니다.", adminUserListDtoSchema)
    ),
    summary: "어드민 사용자 목록 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(await userService.getUsers(context.req.valid("query")), 200)

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createGetUserRoute({
  userService,
  sessionResolver,
}: UsersRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminUser",
    path: "/users/{userId}",
    request: {
      params: userParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse("어드민 사용자 상세입니다.", adminUserDetailDtoSchema)
      ),
      404: errorJsonResponse("사용자를 찾을 수 없습니다."),
    },
    summary: "어드민 사용자 상세 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { userId } = context.req.valid("param")
    const user = await userService.getUser({
      userId,
    })

    if (user === null) {
      throw notFoundAdminError()
    }

    return context.json(user, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createUpdateUserStatusRoute({
  now,
  sessionResolver,
  userService,
}: UsersRouteDependencies) {
  const routeConfig = {
    method: "patch",
    operationId: "updateAdminUserStatus",
    path: "/users/{userId}/status",
    request: {
      body: jsonRequestBody(adminUpdateUserStatusRequestSchema),
      params: userParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "상태가 변경된 어드민 사용자입니다.",
          adminUserDetailDtoSchema
        )
      ),
      400: errorJsonResponse("잘못된 요청입니다."),
      404: errorJsonResponse("사용자를 찾을 수 없습니다."),
    },
    summary: "어드민 사용자 상태 변경",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { userId } = context.req.valid("param")
    const { status } = context.req.valid("json")
    const user = await userService.updateUserStatus({
      actor: context.var.adminActor,
      now: now(),
      status,
      userId,
    })

    return context.json(unwrapAdminOwnerMutationResult(user), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createDeleteUserRoute({
  now,
  sessionResolver,
  userService,
}: UsersRouteDependencies) {
  const routeConfig = {
    method: "delete",
    operationId: "deleteAdminUser",
    path: "/users/{userId}",
    request: {
      params: userParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "삭제 처리된 어드민 사용자 결과입니다.",
          adminDeleteUserResultSchema
        )
      ),
      404: errorJsonResponse("사용자를 찾을 수 없습니다."),
    },
    summary: "어드민 사용자 삭제 상태 전환",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { userId } = context.req.valid("param")
    const result = await userService.deleteUser({
      actor: context.var.adminActor,
      now: now(),
      userId,
    })

    return context.json(unwrapAdminOwnerMutationResult(result), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}
