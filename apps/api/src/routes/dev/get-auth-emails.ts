import {
  authEmailMessageSchema,
  authEmailQuerySchema,
} from "@workspace/core/modules/auth"
import { NotFoundError } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { ReadLatestAuthEmail } from "../../runtime/modules/auth"

export default route({
  method: "get",
  path: "/dev/auth-emails",
  inject: { readLatestAuthEmail: ReadLatestAuthEmail },
  request: { query: authEmailQuerySchema },
  response: { 200: authEmailMessageSchema, default: defaultErrorResponse },
  meta: {
    description:
      "로컬 또는 테스트 환경에서 전송된 인증 메일을 조회합니다. 운영 앱에는 등록되지 않습니다.",
    summary: "인증 메일 조회 (개발용)",
    tags: ["개발"],
  },
  handler: ({ readLatestAuthEmail, query }) => {
    if (!readLatestAuthEmail) {
      throw new NotFoundError("인증 메일 inbox가 구성되지 않았습니다.")
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
