import {
  PROMPT_CATEGORIES,
  promptCategoriesResponseSchema,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"

export default route({
  method: "get",
  path: "/prompts/categories",
  inject: {},
  request: {},
  response: {
    200: promptCategoriesResponseSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description: "글감 카테고리 목록을 반환합니다. (감각, 회고, 의견)",
    summary: "글감 카테고리 목록",
    tags: ["글감"],
  },
  handler: async () => {
    return { items: [...PROMPT_CATEGORIES] }
  },
})
