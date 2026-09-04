import type { LessonStepDto } from "@workspace/contracts/content/course"
import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import type { LessonAuthoringIssue } from "@workspace/contracts/content/authoring"
import { collectLessonAuthoringIssues } from "@workspace/contracts/content/authoring"

export type AuthoringValidationIssue = LessonAuthoringIssue

type AuthoringSeedStepType =
  | "categorize"
  | "compare"
  | "error_correct"
  | "fill_blank"
  | "match"
  | "multiple_choice"
  | "order"
  | "reading"
  | "select"
  | "sentence_build"
  | "true_false"

const standardTypeBySeedType: Record<AuthoringSeedStepType, string> = {
  categorize: "CATEGORIZE",
  compare: "COMPARE",
  error_correct: "ERROR_CORRECT",
  fill_blank: "FILL_BLANK",
  match: "MATCH",
  multiple_choice: "MULTIPLE_CHOICE",
  order: "ORDER",
  reading: "READING",
  select: "SELECT",
  sentence_build: "SENTENCE_BUILD",
  true_false: "TRUE_FALSE",
}

export function hasAuthoringErrors(
  issues: readonly AuthoringValidationIssue[]
): boolean {
  return issues.some((issue) => issue.severity === "error")
}

export function validateAuthoringLessonSteps(input: {
  readonly lessonId: string
  readonly steps: unknown
}): readonly AuthoringValidationIssue[] {
  if (!Array.isArray(input.steps)) {
    return [
      {
        message: "루트가 배열이 아닙니다.",
        path: input.lessonId,
        severity: "error",
      },
    ]
  }

  const issues: AuthoringValidationIssue[] = []
  const parsedSteps: LessonStepDto[] = []

  input.steps.forEach((step, index) => {
    const stepId = `${input.lessonId}-s${index + 1}`
    if (!isRecord(step)) {
      issues.push({
        message: "스텝이 객체가 아닙니다.",
        path: stepId,
        severity: "error",
      })
      return
    }

    const seedType = step["type"]
    if (typeof seedType !== "string") {
      issues.push({
        message: "스텝 유형이 없습니다.",
        path: stepId,
        severity: "error",
      })
      return
    }

    if (!isAuthoringSeedStepType(seedType)) {
      issues.push({
        message: `알 수 없는 스텝 유형입니다: ${seedType}`,
        path: stepId,
        severity: "error",
      })
      return
    }

    const { type: _seedType, ...content } = step
    const parsed = lessonStepDtoSchema.safeParse({
      ...content,
      id: stepId,
      sortOrder: index + 1,
      type: standardTypeBySeedType[seedType],
    })

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({
          message: issue.message,
          path: [stepId, ...issue.path].join("."),
          severity: "error",
        })
      }
      return
    }

    parsedSteps.push(parsed.data)

    const blankMismatch = findBlankCountMismatch(step, seedType)
    if (blankMismatch !== null) {
      issues.push({
        message: blankMismatch,
        path: stepId,
        severity: "error",
      })
    }
  })

  if (issues.length === 0) {
    issues.push(
      ...collectLessonAuthoringIssues({
        lessonId: input.lessonId,
        steps: parsedSteps,
      })
    )
  }

  return issues
}

function findBlankCountMismatch(
  step: Readonly<Record<string, unknown>>,
  seedType: AuthoringSeedStepType
): string | null {
  if (seedType !== "fill_blank") return null
  const template = step["template"]
  const answer = step["answer"]
  if (typeof template !== "string" || !Array.isArray(answer)) return null
  const blanks = template.split("___").length - 1
  return blanks === answer.length
    ? null
    : `template의 빈칸 ${blanks}개와 answer ${answer.length}개가 어긋납니다.`
}

function isAuthoringSeedStepType(
  value: string
): value is AuthoringSeedStepType {
  return value in standardTypeBySeedType
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
