import { z } from "@hono/zod-openapi"
import {
  promptSummarySchema,
  promptIdParamSchema,
} from "@workspace/core/modules/prompts"
import { parsePromptId } from "@workspace/core"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { GetPromptUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/prompts/{promptId}",
  inject: { getPrompt: GetPromptUseCase },
  request: { params: z.object({ promptId: promptIdParamSchema }) },
  response: { 200: promptSummarySchema, default: defaultErrorResponse },
  meta: {
    description: "특정 글감의 상세 정보를 조회합니다.",
    summary: "글감 상세 조회",
    tags: ["글감"],
    security: cookieSecurity,
  },
  handler: async ({ getPrompt, params, context }) => {
    const userId = requireUserId(context)
    const result = await getPrompt(parsePromptId(params.promptId), userId)
    return unwrapOrThrow(result)
  },
})
