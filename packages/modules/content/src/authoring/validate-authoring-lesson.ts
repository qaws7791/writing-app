import type { LessonStepDto } from "@workspace/contracts/content/course"
import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import { collectLessonAuthoringIssues } from "@workspace/contracts/content/authoring"

export type AuthoringValidationIssue = Readonly<{
  message: string
  path: string
}>

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

const seedTypeByKind: Record<string, AuthoringSeedStepType> = {
  Cg: "categorize",
  Cp: "compare",
  EC: "error_correct",
  FB: "fill_blank",
  MC: "multiple_choice",
  Mt: "match",
  Or: "order",
  Rd: "reading",
  SB: "sentence_build",
  Sl: "select",
  TF: "true_false",
}

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

export function validateAuthoringLessonSteps(input: {
  readonly lessonId: string
  readonly steps: unknown
}): readonly AuthoringValidationIssue[] {
  if (!Array.isArray(input.steps)) {
    return [
      {
        message: "루트가 배열이 아닙니다.",
        path: input.lessonId,
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
      })
      return
    }

    const seedType = step["type"]
    if (typeof seedType !== "string") {
      issues.push({
        message: "스텝 유형이 없습니다.",
        path: stepId,
      })
      return
    }

    if (!isAuthoringSeedStepType(seedType)) {
      issues.push({
        message: `알 수 없는 스텝 유형입니다: ${seedType}`,
        path: stepId,
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

export function validateAuthoringLessonLayout(input: {
  readonly layout: readonly string[]
  readonly lessonId: string
  readonly stepCount: number
  readonly steps: unknown
}): readonly AuthoringValidationIssue[] {
  const issues = [...validateAuthoringLessonSteps(input)]
  if (!Array.isArray(input.steps)) return issues

  if (input.steps.length !== input.stepCount) {
    issues.push({
      message: `스텝 개수가 다릅니다. 기대 ${input.stepCount}개, 실제 ${input.steps.length}개`,
      path: input.lessonId,
    })
    return issues
  }

  const expectedTypes = input.layout.map((kind) => {
    const seedType = seedTypeByKind[kind]
    if (seedType === undefined) {
      throw new Error(`알 수 없는 템플릿 약칭: ${kind}`)
    }
    return seedType
  })

  const actualTypes = input.steps.map((step) =>
    isRecord(step) ? String(step["type"]) : "<유형 없음>"
  )
  const mismatch = actualTypes.findIndex(
    (type, index) => type !== expectedTypes[index]
  )
  if (mismatch >= 0) {
    issues.push({
      message: `${mismatch + 1}번째 스텝 유형이 다릅니다. 기대 ${expectedTypes[mismatch]}, 실제 ${actualTypes[mismatch]}`,
      path: input.lessonId,
    })
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
