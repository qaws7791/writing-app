import {
  lessonStepDtoSchema,
  type LessonStepDto,
} from "@workspace/contracts/content/steps"
import { z } from "zod"

const rawStepContentSchema = z.object({ type: z.string() }).passthrough()

export type EditorStep = LessonStepDto & {
  readonly contentStatus: "active" | "archived"
}

export type EditorStepParseResult =
  | {
      readonly state: "valid"
      readonly step: EditorStep
    }
  | {
      readonly id: string
      readonly message: string
      readonly rawType: string
      readonly state: "invalid"
    }

export type WireEditorStep = {
  readonly contentJson: string
  readonly id: string
  readonly sortOrder: number
  readonly status: "active" | "archived"
  readonly type: string
}

/** transport step을 편집 가능한 canonical union으로 검증한다. */
export function parseEditorStep(step: WireEditorStep): EditorStepParseResult {
  const contentResult = parseContentJson(step)
  if (contentResult.state === "invalid") {
    return contentResult
  }

  const { type: _storedSourceType, ...content } = contentResult.content
  const result = lessonStepDtoSchema.safeParse({
    id: step.id,
    sortOrder: step.sortOrder,
    type: step.type,
    ...content,
  })

  if (!result.success) {
    return invalidStep(
      step,
      result.error.issues
        .map(
          (issue) => `${issue.path.join(".") || "content"}: ${issue.message}`
        )
        .join(", ")
    )
  }

  return {
    state: "valid",
    step: {
      ...result.data,
      contentStatus: step.status,
    },
  }
}

function parseContentJson(step: WireEditorStep):
  | {
      readonly content: z.infer<typeof rawStepContentSchema>
      readonly state: "valid"
    }
  | Extract<EditorStepParseResult, { readonly state: "invalid" }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(step.contentJson)
  } catch {
    return invalidStep(step, "contentJson이 유효한 JSON이 아닙니다.")
  }

  const result = rawStepContentSchema.safeParse(parsed)
  if (!result.success) {
    return invalidStep(
      step,
      "contentJson은 문자열 type을 포함한 객체여야 합니다."
    )
  }

  return {
    content: result.data,
    state: "valid",
  }
}

function invalidStep(
  step: WireEditorStep,
  message: string
): Extract<EditorStepParseResult, { readonly state: "invalid" }> {
  return {
    id: step.id,
    message,
    rawType: step.type,
    state: "invalid",
  }
}
