import {
  promptWritingsQuerySchema,
  promptWritingsResponseSchema,
  promptIdParamSchema,
  toPromptId,
} from "@workspace/core"
import { z } from "@hono/zod-openapi"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { ListPromptWritingsUseCase } from "../../runtime/tokens"

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
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ listPromptWritings, params, query, context }) => {
    const userId = context.get("userId")
    const result = await listPromptWritings(
      toPromptId(params.promptId),
      userId,
      query
    )
    return unwrapOrThrow(result)
  },
})
