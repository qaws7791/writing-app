import { promptIdParamSchema } from "@workspace/core/modules/prompts"
import {
  promptWritingsQuerySchema,
  promptWritingsResponseSchema,
} from "@workspace/core/modules/writings"
import { parsePromptId } from "@workspace/core"
import { z } from "@hono/zod-openapi"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { ListPromptWritingsUseCase } from "../../runtime/modules/prompts"

export default route({
  method: "get",
  path: "/prompts/{promptId}/writings",
  inject: { listPromptWritings: ListPromptWritingsUseCase },
  request: {
    params: z.object({ promptId: promptIdParamSchema }),
    query: promptWritingsQuerySchema,
  },
  response: {
    200: promptWritingsResponseSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description:
      "특정 글감을 주제로 작성된 공개 글 목록을 커서 기반 페이지네이션으로 조회합니다.",
    summary: "글감별 공개 글 목록 조회",
    tags: ["글감"],
    security: cookieSecurity,
    deprecated: true,
  },
  handler: async ({ listPromptWritings, params, query, context }) => {
    const userId = context.get("userId")
    return listPromptWritings(parsePromptId(params.promptId), userId, query)
  },
})
