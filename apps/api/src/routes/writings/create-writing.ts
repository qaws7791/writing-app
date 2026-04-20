import {
  createWritingBodySchema,
  writingDetailSchema,
} from "@workspace/core/modules/writings"
import { parsePromptId } from "@workspace/core"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { CreateWritingUseCase } from "../../runtime/modules/writings"

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
    security: cookieSecurity,
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
          : parsePromptId(body.sourcePromptId),
    })
    return unwrapOrThrow(result)
  },
})
