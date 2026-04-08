import {
  promptFiltersQuerySchema,
  promptListPageResponseSchema,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { ListPromptsUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/prompts",
  inject: { listPrompts: ListPromptsUseCase },
  request: { query: promptFiltersQuerySchema },
  response: {
    200: promptListPageResponseSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description:
      "카테고리(promptType) 필터와 커서 기반 페이지네이션으로 글감 목록을 조회합니다.",
    summary: "글감 목록 조회",
    tags: ["글감"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ listPrompts, query, context }) => {
    const userId = requireUserId(context)
    const result = await listPrompts(userId, query)
    return unwrapOrThrow(result)
  },
})
