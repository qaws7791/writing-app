import {
  promptFiltersQuerySchema,
  promptListResponseSchema,
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
  response: { 200: promptListResponseSchema, default: defaultErrorResponse },
  meta: {
    description:
      "주제, 난이도, 검색어 등 필터를 적용하여 글감 목록을 조회합니다.",
    summary: "글감 목록 조회",
    tags: ["글감"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ listPrompts, query, context }) => {
    const userId = requireUserId(context)
    const result = await listPrompts(userId, query)
    const prompts = unwrapOrThrow(result)
    return { items: prompts }
  },
})
