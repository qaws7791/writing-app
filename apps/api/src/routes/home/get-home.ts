import { homeSnapshotSchema } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { GetHomeUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/home",
  inject: { getHome: GetHomeUseCase },
  response: { 200: homeSnapshotSchema, default: defaultErrorResponse },
  meta: {
    description: "진행 중인 여정 목록과 글쓰기 제안 여부를 조회합니다.",
    summary: "홈 조회",
    tags: ["홈"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ getHome, context }) => {
    const userId = requireUserId(context)
    return getHome(userId)
  },
})
