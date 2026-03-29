import { z } from "@hono/zod-openapi"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"

const app = createRouter()

app.openAPIRegistry.registerPath({
  description:
    "이메일과 비밀번호로 회원가입합니다. 가입 후 이메일 인증이 필요합니다.",
  method: "post",
  path: "/api/auth/sign-up/email",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            name: z.string().min(1),
            password: z.string().min(8).max(128),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string(),
          }),
        },
      },
      description: "회원가입 성공",
    },
    default: defaultErrorResponse,
  },
  summary: "이메일 회원가입",
  tags: ["인증"],
})

app.openAPIRegistry.registerPath({
  description: "이메일과 비밀번호로 로그인합니다.",
  method: "post",
  path: "/api/auth/sign-in/email",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            session: z.object({
              id: z.string(),
              token: z.string(),
              userId: z.string(),
            }),
            user: z.object({
              id: z.string(),
              email: z.string(),
              name: z.string(),
            }),
          }),
        },
      },
      description: "로그인 성공",
    },
    default: defaultErrorResponse,
  },
  summary: "이메일 로그인",
  tags: ["인증"],
})

app.openAPIRegistry.registerPath({
  description: "현재 세션을 종료하고 로그아웃합니다.",
  method: "post",
  path: "/api/auth/sign-out",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
      description: "로그아웃 성공",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "로그아웃",
  tags: ["인증"],
})

app.openAPIRegistry.registerPath({
  description: "비밀번호 재설정 이메일을 전송합니다.",
  method: "post",
  path: "/api/auth/forget-password",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            redirectTo: z.string().url().optional(),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.boolean(),
          }),
        },
      },
      description: "재설정 이메일 전송 완료",
    },
    default: defaultErrorResponse,
  },
  summary: "비밀번호 재설정 요청",
  tags: ["인증"],
})

app.openAPIRegistry.registerPath({
  description: "이메일로 전송된 토큰을 사용하여 비밀번호를 재설정합니다.",
  method: "post",
  path: "/api/auth/reset-password",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            newPassword: z.string().min(8).max(128),
            token: z.string(),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.boolean(),
          }),
        },
      },
      description: "비밀번호 재설정 성공",
    },
    default: defaultErrorResponse,
  },
  summary: "비밀번호 재설정",
  tags: ["인증"],
})

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return c.var.authHandler(c.req.raw)
})

export default app
