import { homeSnapshotSchema } from "@workspace/core/modules/home"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { GetHomeUseCase } from "../../runtime/modules/home"

export default route({
  method: "get",
  path: "/home",
  inject: { getHome: GetHomeUseCase },
  response: { 200: homeSnapshotSchema, default: defaultErrorResponse },
  meta: {
    description: "첫 문장 루프 시작 행동과 문체 정원 요약을 조회합니다.",
    summary: "홈 조회",
    tags: ["홈"],
    security: cookieSecurity,
  },
  handler: async ({ getHome, context }) => {
    const userId = requireUserId(context)
    return getHome(userId)
  },
})
