import type { MiddlewareHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import type { RouteHandler } from "@hono/zod-openapi"
import { describe, expect, it } from "vitest"

import { createApp, defineRoute, defineRouteForEnv } from "#hono/core"
import type { AnyRouteConfig } from "#hono/core"
import { AppError, ErrorResponseSchema } from "#hono/errors"
import { z } from "#hono/zod"

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const MeSchema = z.object({
  id: z.string(),
})

const EnvUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
})

const UserParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      in: "path",
      name: "id",
    },
  }),
})

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

const getUserRouteConfig = {
  method: "get",
  path: "/users/{id}",
  request: {
    params: UserParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "User found",
    },
  },
} satisfies AnyRouteConfig

const getUserHandler: RouteHandler<typeof getUserRouteConfig> = (context) => {
  const { id } = context.req.valid("param")

  return context.json({ id, name: "Ada" }, 200)
}

const getUserRoute = defineRoute({
  ...getUserRouteConfig,
  handler: getUserHandler,
})

const createUserRouteConfig = {
  method: "post",
  path: "/users",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "User created",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Validation failed",
    },
  },
} as const

const createUserHandler: RouteHandler<typeof createUserRouteConfig> = (
  context
) => {
  const input = context.req.valid("json")

  return context.json({ id: "user_1", name: input.name }, 201)
}

const createUserRoute = defineRoute({
  ...createUserRouteConfig,
  handler: createUserHandler,
})

const appErrorRoute = defineRoute({
  method: "get",
  path: "/app-error",
  responses: {
    409: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Conflict",
    },
  },
  handler: () => {
    throw new AppError({
      code: "USER_ALREADY_EXISTS",
      errors: [
        {
          message: "Email already exists",
          path: "email",
        },
      ],
      message: "User already exists",
      status: 409,
    })
  },
})

const httpExceptionRoute = defineRoute({
  method: "get",
  path: "/http-exception",
  responses: {
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Unauthorized",
    },
  },
  handler: () => {
    throw new HTTPException(401, {
      message: "Token expired",
    })
  },
})

const unexpectedErrorRoute = defineRoute({
  method: "get",
  path: "/unexpected-error",
  responses: {
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error",
    },
  },
  handler: () => {
    throw new Error("database password leaked")
  },
})

type AuthEnv = {
  Variables: {
    user: {
      id: string
    }
  }
}

const setUser: MiddlewareHandler<AuthEnv> = async (context, next) => {
  context.set("user", { id: "user_1" })

  await next()
}

const getMeRoute = defineRoute<AuthEnv>({
  method: "get",
  middleware: [setUser] as const,
  path: "/me",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MeSchema,
        },
      },
      description: "Current user",
    },
  },
  handler: (context) => {
    return context.json({ id: context.var.user.id }, 200)
  },
})

const defineAuthRoute = defineRouteForEnv<AuthEnv>()

const getEnvUserRouteConfig = {
  method: "get",
  middleware: [setUser],
  path: "/env-users/{id}",
  request: {
    params: UserParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EnvUserSchema,
        },
      },
      description: "Env user found",
    },
  },
} satisfies AnyRouteConfig

const getEnvUserHandler: RouteHandler<typeof getEnvUserRouteConfig, AuthEnv> = (
  context
) => {
  const { id } = context.req.valid("param")

  return context.json({ id, userId: context.var.user.id }, 200)
}

const getEnvUserRoute = defineAuthRoute({
  ...getEnvUserRouteConfig,
  handler: getEnvUserHandler,
})

describe("createApp", () => {
  const app = createApp({
    routes: [
      getUserRoute,
      createUserRoute,
      appErrorRoute,
      httpExceptionRoute,
      unexpectedErrorRoute,
      getMeRoute,
      getEnvUserRoute,
    ] as const,
  })

  it("registers defined OpenAPI routes", async () => {
    const response = await app.request("/users/user_1")

    await expect(response.json()).resolves.toEqual({
      id: "user_1",
      name: "Ada",
    })
    expect(response.status).toBe(200)
  })

  it("returns standardized validation errors", async () => {
    const response = await app.request("/users", {
      body: JSON.stringify({
        email: "invalid-email",
        name: "",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: "email",
        }),
        expect.objectContaining({
          path: "name",
        }),
      ]),
      message: "Request validation failed",
    })
    expect(response.status).toBe(400)
  })

  it("returns AppError response bodies without changing their public message", async () => {
    const response = await app.request("/app-error")

    await expect(response.json()).resolves.toEqual({
      code: "USER_ALREADY_EXISTS",
      errors: [
        {
          message: "Email already exists",
          path: "email",
        },
      ],
      message: "User already exists",
    })
    expect(response.status).toBe(409)
  })

  it("keeps only HTTPException status and default message", async () => {
    const response = await app.request("/http-exception")

    await expect(response.json()).resolves.toEqual({
      code: "HTTP_EXCEPTION",
      message: "Unauthorized",
    })
    expect(response.status).toBe(401)
  })

  it("hides unexpected error messages", async () => {
    const response = await app.request("/unexpected-error")

    await expect(response.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    })
    expect(response.status).toBe(500)
  })

  it("500 응답과 내부 오류 로그를 같은 request id로 연결하고 원인을 제한한다", async () => {
    const errors: unknown[] = []
    const errorApp = createApp({
      errorLogger: (event) => errors.push(event),
      middleware: [
        async (context, next) => {
          context.set("requestId", "server-request-id")
          await next()
        },
      ],
      routes: [unexpectedErrorRoute] as const,
    })

    const response = await errorApp.request("/unexpected-error")

    expect(response.status).toBe(500)
    expect(errors).toEqual([
      expect.objectContaining({
        causeClass: undefined,
        errorClass: "Error",
        requestId: "server-request-id",
        status: 500,
      }),
    ])
    expect(JSON.stringify(errors)).not.toContain("database password leaked")
  })

  it("returns a standardized not found response", async () => {
    const response = await app.request("/missing")

    await expect(response.json()).resolves.toEqual({
      code: "NOT_FOUND",
      message: "Not Found",
    })
    expect(response.status).toBe(404)
  })

  it("supports route-level Env typing with middleware", async () => {
    const response = await app.request("/me")

    await expect(response.json()).resolves.toEqual({
      id: "user_1",
    })
    expect(response.status).toBe(200)
  })

  it("runs global middleware before routes", async () => {
    const calls: string[] = []
    const middlewareApp = createApp({
      middleware: [
        async (_context, next) => {
          calls.push("middleware")

          await next()
        },
      ],
      routes: [
        defineRoute({
          method: "get",
          path: "/middleware-order",
          responses: {
            200: {
              description: "Middleware order",
            },
          },
          handler: (context) => {
            calls.push("handler")

            return context.text("ok")
          },
        }),
      ] as const,
    })

    const response = await middlewareApp.request("/middleware-order")

    await expect(response.text()).resolves.toBe("ok")
    expect(calls).toEqual(["middleware", "handler"])
  })

  it("supports app-specific Env route builders with validated input", async () => {
    const response = await app.request("/env-users/user_2")

    await expect(response.json()).resolves.toEqual({
      id: "user_2",
      userId: "user_1",
    })
    expect(response.status).toBe(200)
  })
})

describe("defineRoute", () => {
  it("rejects Hono-style path parameters", () => {
    expect(() =>
      defineRoute({
        method: "get",
        path: "/users/:id",
        responses: {
          200: {
            description: "User found",
          },
        },
        handler: (context) => context.text("ok"),
      })
    ).toThrow(
      'Invalid route path "/users/:id". Use OpenAPI path parameters like "/users/{id}", not Hono-style "/users/:id".'
    )
  })
})
