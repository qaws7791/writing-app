import { createRoute } from "@hono/zod-openapi"
import type { MiddlewareHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import { describe, expect, it } from "vitest"

import { createApp } from "#http-platform/core/create-app"
import {
  AppError,
  ErrorResponseSchema,
  type InternalErrorLogger,
} from "#http-platform/errors"
import { z } from "#http-platform/openapi"

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const userParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      in: "path",
      name: "id",
    },
  }),
})

const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
})

type TestEnv = {
  Variables: {
    requestId: string
    user: {
      id: string
    }
  }
}

const setRequestId: MiddlewareHandler<TestEnv> = async (context, next) => {
  context.set("requestId", "test-request-id")
  await next()
}

const setUser: MiddlewareHandler<TestEnv> = async (context, next) => {
  context.set("user", { id: "user-1" })
  await next()
}

describe("createApp", () => {
  it("validation 오류를 canonical 400 envelope로 반환한다", async () => {
    const app = createFixture()
    const response = await app.request("/users", {
      body: JSON.stringify({ email: "invalid-email", name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
      requestId: "test-request-id",
      violations: expect.arrayContaining([
        expect.objectContaining({ path: "email" }),
        expect.objectContaining({ path: "name" }),
      ]),
    })
  })

  it("AppError의 public message와 violations를 canonical 409로 보존한다", async () => {
    const app = createFixture()
    const response = await app.request("/app-error")

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: "USER_ALREADY_EXISTS",
      message: "User already exists",
      requestId: "test-request-id",
      violations: [
        {
          message: "Email already exists",
          path: "email",
        },
      ],
    })
  })

  it("HTTPException의 원문은 숨기고 status 의미만 canonical 401로 공개한다", async () => {
    const app = createFixture()
    const response = await app.request("/http-exception")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "HTTP_ERROR",
      message: "Unauthorized",
      requestId: "test-request-id",
    })
  })

  it("예상하지 못한 오류를 redacted 500으로 기록하고 같은 request ID로 연결한다", async () => {
    const errors: Parameters<InternalErrorLogger>[0][] = []
    const app = createFixture((event) => errors.push(event))
    const response = await app.request("/unexpected-error")

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
      requestId: "test-request-id",
    })
    expect(errors).toEqual([
      expect.objectContaining({
        errorClass: "Error",
        requestId: "test-request-id",
        status: 500,
      }),
    ])
    expect(JSON.stringify(errors)).not.toContain("database password leaked")
  })

  it("not-found를 canonical 404 envelope로 반환한다", async () => {
    const app = createFixture()
    const response = await app.request("/missing")

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: "NOT_FOUND",
      message: "Not Found",
      requestId: "test-request-id",
    })
  })

  it.each([
    ["SQL", () => new Error("SELECT password FROM user")],
    [
      "provider 원문",
      () =>
        new HTTPException(502, {
          message: "provider response body: raw-provider-sentinel",
        }),
    ],
    [
      "credential과 개인정보",
      () =>
        new Error(
          "Authorization: Bearer credential-sentinel learner@example.test"
        ),
    ],
  ])("public 5xx error에서 %s 정보를 노출하지 않는다", async (_, error) => {
    const app = createApp<TestEnv>({ middleware: [setRequestId] })
    const route = createRoute({
      method: "get",
      path: "/hostile-error",
      responses: { 500: { description: "Internal server error" } },
    })
    app.openapi(route, () => {
      throw error()
    })

    const response = await app.request("/hostile-error")
    const body = JSON.stringify(await response.json())

    expect(response.status).toBeGreaterThanOrEqual(500)
    expect(body).not.toMatch(
      /SELECT|password|provider response|raw-provider|Authorization|Bearer|credential-sentinel|learner@example/iu
    )
    expect(ErrorResponseSchema.safeParse(JSON.parse(body)).success).toBe(true)
  })
})

function createFixture(errorLogger?: InternalErrorLogger) {
  const app = createApp<TestEnv>({
    errorLogger,
    middleware: [setRequestId],
  })

  const getUserRoute = createRoute({
    method: "get",
    path: "/users/{id}",
    request: { params: userParamsSchema },
    responses: {
      200: {
        content: { "application/json": { schema: userSchema } },
        description: "User found",
      },
    },
  })
  app.openapi(getUserRoute, (context) =>
    context.json({ id: context.req.valid("param").id, name: "Ada" }, 200)
  )

  const createUserRoute = createRoute({
    method: "post",
    path: "/users",
    request: {
      body: {
        content: { "application/json": { schema: createUserSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { "application/json": { schema: userSchema } },
        description: "User created",
      },
      400: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Validation failed",
      },
    },
  })
  app.openapi(createUserRoute, (context) =>
    context.json({ id: "user-1", name: context.req.valid("json").name }, 201)
  )

  const appErrorRoute = createRoute({
    method: "get",
    path: "/app-error",
    responses: {
      409: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Conflict",
      },
    },
  })
  app.openapi(appErrorRoute, () => {
    throw new AppError({
      code: "USER_ALREADY_EXISTS",
      message: "User already exists",
      status: 409,
      violations: [
        {
          message: "Email already exists",
          path: "email",
        },
      ],
    })
  })

  const httpExceptionRoute = createRoute({
    method: "get",
    path: "/http-exception",
    responses: { 401: { description: "Unauthorized" } },
  })
  app.openapi(httpExceptionRoute, () => {
    throw new HTTPException(401, { message: "Token expired" })
  })

  const unexpectedErrorRoute = createRoute({
    method: "get",
    path: "/unexpected-error",
    responses: { 500: { description: "Internal server error" } },
  })
  app.openapi(unexpectedErrorRoute, () => {
    throw new Error("database password leaked")
  })

  const envUserRoute = createRoute({
    method: "get",
    middleware: [setUser],
    path: "/env-users/{id}",
    request: { params: userParamsSchema },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({ id: z.string(), userId: z.string() }),
          },
        },
        description: "Env user found",
      },
    },
  })
  app.openapi(envUserRoute, (context) =>
    context.json(
      {
        id: context.req.valid("param").id,
        userId: context.var.user.id,
      },
      200
    )
  )

  return app
}
