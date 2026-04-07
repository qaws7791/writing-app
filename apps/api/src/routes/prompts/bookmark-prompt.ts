import { z } from "@hono/zod-openapi"
import {
  promptIdParamSchema,
  promptBookmarkResponseSchema,
  toPromptId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { BookmarkPromptUseCase } from "../../runtime/tokens"

export default route({
  method: "put",
  path: "/prompts/{promptId}/bookmark",
  inject: { bookmarkPrompt: BookmarkPromptUseCase },
  request: { params: z.object({ promptId: promptIdParamSchema }) },
  response: {
    200: promptBookmarkResponseSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description: "글감을 북마크에 추가합니다.",
    summary: "글감 북마크",
    tags: ["글감"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ bookmarkPrompt, params, context }) => {
    const userId = requireUserId(context)
    const result = await bookmarkPrompt(userId, toPromptId(params.promptId))
    const { savedAt } = unwrapOrThrow(result)
    return { kind: "bookmarked" as const, savedAt }
  },
})
