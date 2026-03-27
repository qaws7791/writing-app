import { createRoute, z } from "@hono/zod-openapi"

import { NotFoundError } from "@workspace/core"
import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"

const authEmailResponseSchema = z.object({
  email: z.string(),
  kind: z.enum(["password-reset", "verification"]),
  sentAt: z.string(),
  token: z.string(),
  url: z.string(),
})

const route = createRoute({
  description:
    "개발 환경에서 전송된 인증 메일을 조회합니다. 프로덕션에서는 비활성화됩니다.",
  method: "get",
  path: "/dev/auth-emails",
  request: {
    query: z.object({
      email: z.string().email(),
      kind: z.enum(["password-reset", "verification"]),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: authEmailResponseSchema,
        },
      },
      description: "인증 메일 정보",
    },
    default: defaultErrorResponse,
  },
  summary: "인증 메일 조회 (개발용)",
  tags: ["개발"],
})

const app = createRouter()

app.openapi(route, (c) => {
  const { email, kind } = c.req.valid("query")
  const { readLatestAuthEmail } = c.var.services

  if (!readLatestAuthEmail) {
    throw new NotFoundError("개발 환경에서만 사용할 수 있습니다.")
  }

  const message = readLatestAuthEmail({ email, kind })

  if (!message) {
    throw new NotFoundError("전송된 인증 메일을 찾을 수 없습니다.")
  }

  return c.json(message, 200)
})

export default app
