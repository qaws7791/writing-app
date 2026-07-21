import type { AnyRouteConfig } from "@/http/platform/core"
import {
  adminDeleteUserResultSchema,
  adminUserListDtoSchema,
} from "@workspace/contracts/admin/admin-users"
import { adminUpdateUserStatusRequestSchema } from "@workspace/contracts/admin/admin-shared"
import {
  adminUserDetailDtoSchema,
  adminUserListStatusFilterSchema,
  adminUserSortSchema,
  userIdSchema,
} from "@workspace/contracts/admin/identity-data"
import type {
  AdminUserReader,
  ReadAdminUsersResult,
} from "@workspace/core/admin"
import type {
  AdminUserDeleteResult,
  AdminUserMutationUseCase,
  AdminUserStatusUpdateResult,
} from "@workspace/core/auth"
import { z } from "@/http/platform/zod"

import type { AdminSessionResolver } from "@workspace/auth/admin/server"
import { forbiddenAdminError, notFoundAdminError } from "@/admin/admin-errors"
import {
  defineAdminRoute,
  type AdminRouteHandler,
} from "@/admin/admin-hono-env"
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

const defaultPage = 1
const defaultPageSize = 20
const maxPageSize = 100

const usersQuerySchema = z.object({
  page: positiveIntegerQuery({ fallback: defaultPage }),
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

export type AdminIdentityRouteDependencies = {
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
  readonly userMutationService: AdminUserMutationUseCase
  readonly userReader: AdminUserReader
}

export function createAdminIdentityRoutes(
  dependencies: AdminIdentityRouteDependencies
): AdminRouteGroup {
  return defineAdminRouteGroup([
    createListUsersRoute(dependencies),
    createGetUserRoute(dependencies),
    createUpdateUserStatusRoute(dependencies),
    createDeleteUserRoute(dependencies),
  ])
}

function createListUsersRoute({
  sessionResolver,
  userReader,
}: AdminIdentityRouteDependencies) {
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

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const query = context.req.valid("query")
    const result = await userReader.readUsers({
      page: query.page,
      pageSize: query.pageSize,
      query: query.query,
      sort: query.sort,
      status: query.status,
    })

    return context.json(toAdminUserListResponse(result), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createGetUserRoute({
  sessionResolver,
  userReader,
}: AdminIdentityRouteDependencies) {
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
    const user = await userReader.readUser({ userId })

    if (user === null) throw notFoundAdminError()

    return context.json(adminUserDetailDtoSchema.parse(user), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createUpdateUserStatusRoute({
  now,
  sessionResolver,
  userMutationService,
}: AdminIdentityRouteDependencies) {
  const routeConfig = {
    method: "patch",
    operationId: "updateAdminUserStatus",
    path: "/users/{userId}/status",
    request: {
      body: {
        content: {
          "application/json": {
            schema: adminUpdateUserStatusRequestSchema,
          },
        },
      },
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
    const result = await userMutationService.updateUserStatus({
      actor: context.var.adminActor,
      now: now(),
      status,
      userId,
    })

    return context.json(
      adminUserDetailDtoSchema.parse(unwrapUserStatusUpdateResult(result)),
      200
    )
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createDeleteUserRoute({
  now,
  sessionResolver,
  userMutationService,
}: AdminIdentityRouteDependencies) {
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
    const result = await userMutationService.deleteUser({
      actor: context.var.adminActor,
      now: now(),
      userId,
    })

    return context.json(toDeleteUserResponse(result), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function positiveIntegerQuery(input: {
  readonly fallback: number
  readonly max?: number
}) {
  const schema = z.coerce.number().int().positive()

  return (input.max === undefined ? schema : schema.max(input.max))
    .optional()
    .default(input.fallback)
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

function unwrapUserStatusUpdateResult(result: AdminUserStatusUpdateResult) {
  switch (result.kind) {
    case "forbidden":
      throw forbiddenAdminError()
    case "not-found":
      throw notFoundAdminError()
    case "ok":
      return result.value
  }
}

function toDeleteUserResponse(result: AdminUserDeleteResult) {
  switch (result.kind) {
    case "forbidden":
      throw forbiddenAdminError()
    case "not-found":
      throw notFoundAdminError()
    case "ok":
      return adminDeleteUserResultSchema.parse({ deleted: true })
  }
}
