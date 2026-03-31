import { z } from "@hono/zod-openapi"
import { NotFoundError } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { ReadLatestAuthEmail } from "../../runtime/tokens"

const authEmailResponseSchema = z.object({
  email: z.string(),
  kind: z.enum(["password-reset", "verification"]),
  sentAt: z.string(),
  token: z.string(),
  url: z.string(),
})

const querySchema = z.object({
  email: z.string().email(),
  kind: z.enum(["password-reset", "verification"]),
})

export default route({
  method: "get",
  path: "/dev/auth-emails",
  inject: { readLatestAuthEmail: ReadLatestAuthEmail },
  request: { query: querySchema },
  response: { 200: authEmailResponseSchema, default: defaultErrorResponse },
  meta: {
    description:
      "개발 환경에서 전송된 인증 메일을 조회합니다. 프로덕션에서는 비활성화됩니다.",
    summary: "인증 메일 조회 (개발용)",
    tags: ["개발"],
  },
  handler: ({ readLatestAuthEmail, query }) => {
    if (!readLatestAuthEmail) {
      throw new NotFoundError("개발 환경에서만 사용할 수 있습니다.")
    }
    const message = readLatestAuthEmail({
      email: query.email,
      kind: query.kind,
    })
    if (!message) {
      throw new NotFoundError("전송된 인증 메일을 찾을 수 없습니다.")
    }
    return message
  },
})
