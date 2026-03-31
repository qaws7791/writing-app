import { z } from "@hono/zod-openapi"
import {
  promptIdParamSchema,
  promptSaveResponseSchema,
  toPromptId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { SavePromptUseCase } from "../../runtime/tokens"

export default route({
  method: "put",
  path: "/prompts/{promptId}/save",
  inject: { savePrompt: SavePromptUseCase },
  request: { params: z.object({ promptId: promptIdParamSchema }) },
  response: { 200: promptSaveResponseSchema, default: defaultErrorResponse },
  meta: {
    description:
      "특정 글감을 저장 목록에 추가합니다. 이미 저장된 경우 멱등적으로 동작합니다.",
    summary: "글감 저장",
    tags: ["글감"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ savePrompt, params, context }) => {
    const userId = requireUserId(context)
    const result = await savePrompt(userId, toPromptId(params.promptId))
    const { savedAt } = unwrapOrThrow(result)
    return { kind: "saved" as const, savedAt }
  },
})
