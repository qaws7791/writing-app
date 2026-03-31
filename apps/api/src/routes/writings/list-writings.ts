import {
  cursorPageQuerySchema,
  writingListResponseSchema,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { ListWritingsUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/writings",
  inject: { listWritings: ListWritingsUseCase },
  request: { query: cursorPageQuerySchema },
  response: { 200: writingListResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "현재 사용자의 글 목록을 최근 수정 순으로 조회합니다.",
    summary: "글 목록 조회",
    tags: ["글"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ listWritings, query, context }) => {
    const userId = requireUserId(context)
    return listWritings(userId, query)
  },
})
