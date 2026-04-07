import { z } from "@hono/zod-openapi"
import {
  generateFeedbackBodySchema,
  writingFeedbackSchema,
  writingIdParamSchema,
  toWritingId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import {
  GenerateFeedbackUseCase,
  GetWritingUseCase,
} from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/writings/{writingId}/feedback",
  inject: {
    getWriting: GetWritingUseCase,
    generateFeedback: GenerateFeedbackUseCase,
  },
  request: {
    body: generateFeedbackBodySchema,
    params: z.object({ writingId: writingIdParamSchema }),
  },
  response: { 200: writingFeedbackSchema, default: defaultErrorResponse },
  meta: {
    description: "AI 소크라테스식 피드백을 생성합니다.",
    summary: "AI 피드백 생성",
    tags: ["AI"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ getWriting, generateFeedback, body, params, context }) => {
    const userId = requireUserId(context)
    const writingResult = await getWriting(
      userId,
      toWritingId(params.writingId)
    )
    const writing = unwrapOrThrow(writingResult)
    const result = await generateFeedback({
      bodyPlainText: writing.bodyPlainText,
      level: body.level,
    })
    return unwrapOrThrow(result)
  },
})
