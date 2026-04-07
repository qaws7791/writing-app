import {
  createWritingBodySchema,
  writingDetailSchema,
  toPromptId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { CreateWritingUseCase } from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/writings",
  inject: { createWriting: CreateWritingUseCase },
  request: { body: createWritingBodySchema },
  response: { 201: writingDetailSchema, default: defaultErrorResponse },
  meta: {
    description: "새 글을 생성합니다. 글감을 기반으로 생성할 수 있습니다.",
    summary: "글 생성",
    tags: ["글"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ createWriting, body, context }) => {
    const userId = requireUserId(context)
    const result = await createWriting(userId, {
      title: body.title,
      bodyJson: body.bodyJson,
      bodyPlainText: body.bodyPlainText,
      wordCount: body.wordCount,
      sourcePromptId:
        body.sourcePromptId === undefined
          ? undefined
          : toPromptId(body.sourcePromptId),
    })
    return unwrapOrThrow(result)
  },
})
