import { createRoute } from "@hono/zod-openapi"
import type { MiddlewareHandler } from "hono"
import { describe, expect, it } from "vitest"

import { createApp } from "#http-platform/core/create-app"
import {
  AppError,
  ErrorResponseSchema,
  type InternalErrorLogger,
} from "#http-platform/errors"

type TestEnv = {
  Variables: {
    requestId: string
  }
}

const requestId = "test-request-id"
const setRequestId: MiddlewareHandler<TestEnv> = async (context, next) => {
  context.set("requestId", requestId)
  await next()
}

describe("createApp", () => {
  it("AppError의 public 계약을 canonical 409 응답으로 보존한다", async () => {
    const app = createFixture()

    const response = await app.request("/app-error")

    expect(response.status).toBe(409)
    expect(response.headers.get("x-request-id")).toBe(requestId)
    await expect(response.json()).resolves.toEqual({
      code: "USER_ALREADY_EXISTS",
      message: "User already exists",
      requestId,
      violations: [
        {
          message: "Email already exists",
          path: "email",
        },
      ],
    })
  })

  it("예상하지 못한 오류를 redacted 500으로 기록하고 같은 request ID로 연결한다", async () => {
    const errors: Parameters<InternalErrorLogger>[0][] = []
    const app = createFixture((event) => errors.push(event))

    const response = await app.request("/unexpected-error")

    expect(response.status).toBe(500)
    expect(response.headers.get("x-request-id")).toBe(requestId)
    await expect(response.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
      requestId,
    })
    expect(errors).toEqual([
      expect.objectContaining({
        errorClass: "Error",
        requestId,
        status: 500,
      }),
    ])
    expect(JSON.stringify(errors)).not.toContain("database password leaked")
  })
})

function createFixture(errorLogger?: InternalErrorLogger) {
  const app = createApp<TestEnv>({
    errorLogger,
    middleware: [setRequestId],
  })
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

  const unexpectedErrorRoute = createRoute({
    method: "get",
    path: "/unexpected-error",
    responses: { 500: { description: "Internal server error" } },
  })
  app.openapi(unexpectedErrorRoute, () => {
    throw new Error("database password leaked")
  })

  return app
}
