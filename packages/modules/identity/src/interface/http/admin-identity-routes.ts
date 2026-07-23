import type { RouteHandler } from "@hono/zod-openapi"
import type { Env, Handler, Input, TypedResponse } from "hono"
import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { defineRouteForEnv } from "@workspace/http-platform/core"
import {
  AppError,
  assertExhaustiveHttpResult,
} from "@workspace/http-platform/errors"
import { jsonResponse } from "@workspace/http-platform/openapi"
import {
  adminDeleteUserResultSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
  adminUserParamsSchema,
  adminUsersQuerySchema,
} from "@workspace/contracts/identity/admin-users"
import { identityApiErrorSchema } from "@workspace/contracts/identity/api-error"
import { adminUpdateUserStatusRequestSchema } from "@workspace/contracts/identity/status"

import type { IdentityError } from "#identity/domain/identity-error"
import type {
  AdminUserMutationUseCase,
  AdminUserReader,
  ReadAdminUsersResult,
} from "#identity/application/identity-queries"
import type { AdminSessionResolver } from "#identity/application/identity-sessions"
import {
  adminSessionRouteOptions,
  ownerAdminRouteOptions,
  type IdentityAdminHonoEnv,
} from "#identity/interface/http/admin-auth"

const defineAdminIdentityRoute = defineRouteForEnv<IdentityAdminHonoEnv>()

export type IdentityHttpRouteGroup = readonly {
  readonly handler: unknown
  readonly route: AnyRouteConfig
}[]

export type AdminIdentityRouteDependencies = Readonly<{
  sessionResolver: AdminSessionResolver
  userMutationService: AdminUserMutationUseCase
  userReader: AdminUserReader
}>

export function createAdminIdentityRoutes(
  dependencies: AdminIdentityRouteDependencies
): IdentityHttpRouteGroup {
  return Object.freeze([
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
    request: { query: adminUsersQuerySchema },
    responses: authenticatedResponses(
      jsonResponse("어드민 사용자 목록입니다.", adminUserListDtoSchema)
    ),
    summary: "어드민 사용자 목록 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminIdentityRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const query = context.req.valid("query")
    const result = await userReader.readUsers(query)
    return context.json(toAdminUserListResponse(result), 200)
  }

  return defineAdminIdentityRoute({ ...routeConfig, handler })
}

function createGetUserRoute({
  sessionResolver,
  userReader,
}: AdminIdentityRouteDependencies) {
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
  } satisfies AnyRouteConfig

  const handler: AdminIdentityRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const user = await userReader.readUser(context.req.valid("param"))
    if (user === null) throw mapIdentityError({ kind: "identity-not-found" })
    return context.json(adminUserDetailDtoSchema.parse(user), 200)
  }

  return defineAdminIdentityRoute({ ...routeConfig, handler })
}

function createUpdateUserStatusRoute({
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
      503: errorJsonResponse("세션 폐기를 완료할 수 없습니다."),
    },
    summary: "어드민 사용자 상태 변경",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminIdentityRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const result = await userMutationService.updateUserStatus({
      actor: context.var.adminActor,
      ...context.req.valid("param"),
      ...context.req.valid("json"),
    })
    if (result.isErr()) throw mapIdentityError(result.error)
    return context.json(adminUserDetailDtoSchema.parse(result.value), 200)
  }

  return defineAdminIdentityRoute({ ...routeConfig, handler })
}

function createDeleteUserRoute({
  sessionResolver,
  userMutationService,
}: AdminIdentityRouteDependencies) {
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
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminIdentityRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const result = await userMutationService.deleteUser({
      actor: context.var.adminActor,
      ...context.req.valid("param"),
    })
    if (result.isErr()) throw mapIdentityError(result.error)
    return context.json(
      adminDeleteUserResultSchema.parse({ deleted: true }),
      200
    )
  }

  return defineAdminIdentityRoute({ ...routeConfig, handler })
}

function authenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: errorJsonResponse("관리자 인증이 필요합니다."),
    403: errorJsonResponse("소유자 권한이 필요합니다."),
  }
}

function errorJsonResponse(description: string) {
  return jsonResponse(description, identityApiErrorSchema)
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

function mapIdentityError(error: IdentityError): AppError {
  switch (error.kind) {
    case "identity-forbidden":
    case "identity-deleted":
      return new AppError({
        code: "FORBIDDEN",
        message: "Forbidden",
        status: 403,
      })
    case "identity-not-found":
      return new AppError({
        code: "NOT_FOUND",
        message: "Not Found",
        status: 404,
      })
    case "identity-conflict":
      return new AppError({
        code: "IDENTITY_CONFLICT",
        message: "Identity update conflict",
        status: 409,
      })
    case "identity-invalid-role-transition":
    case "identity-invalid-status-transition":
      return new AppError({
        code: "INVALID_STATUS_TRANSITION",
        message: "Identity transition is not allowed",
        status: 409,
      })
    case "identity-invalid-profile":
      return new AppError({
        code: "VALIDATION_FAILED",
        message: "Identity profile is invalid",
        status: 400,
      })
    case "identity-session-revocation-failed":
      return new AppError({
        code: "IDENTITY_SESSION_REVOCATION_FAILED",
        message: "Identity session revocation failed",
        status: 503,
      })
  }

  return assertExhaustiveHttpResult(error)
}

type AdminIdentityRouteHandler<TRoute extends AnyRouteConfig> =
  RouteHandler<TRoute, IdentityAdminHonoEnv> extends Handler<
    infer TEnv extends Env,
    infer TPath extends string,
    infer TInput extends Input,
    infer _TResponse
  >
    ? Handler<TEnv, TPath, TInput, AdminHandlerResponse>
    : never

type AdminHandlerResponse =
  | Promise<Response | TypedResponse<unknown>>
  | Promise<void>
  | Response
  | TypedResponse<unknown>
