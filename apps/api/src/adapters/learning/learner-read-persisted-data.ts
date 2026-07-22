import { z } from "zod"

import {
  lessonStepDtoSchema,
  type LessonStepDto,
} from "@workspace/contracts/content/course"

const lessonSummarySchema = z.array(z.string())
const persistedStepContentSchema = z.object({ type: z.string() }).passthrough()

type LearnerLessonPersistedStepRow = {
  readonly contentJson: string
  readonly id: string
  readonly sortOrder: number
  readonly type: string
}

export type LearnerLessonPersistedRowBundle = {
  readonly lessonId: string
  readonly stepRows: readonly LearnerLessonPersistedStepRow[]
  readonly summaryJson: string
}

type DecodedLearnerLessonPersistedData = {
  readonly steps: readonly LessonStepDto[]
  readonly summary: readonly string[]
}

export type LearnerLessonPersistedDataCorruption =
  | {
      readonly field: "lesson-summary"
      readonly lessonId: string
      readonly reason: "invalid-json" | "schema-mismatch"
    }
  | {
      readonly field: "lesson-step-content"
      readonly lessonId: string
      readonly reason: "invalid-json" | "schema-mismatch"
      readonly stepId: string
    }

export type LearnerLessonPersistedDataDecodeResult =
  | {
      readonly kind: "decoded"
      readonly value: DecodedLearnerLessonPersistedData
    }
  | {
      readonly corruption: LearnerLessonPersistedDataCorruption
      readonly kind: "corrupt"
    }

export class LearnerLessonPersistedDataCorruptionError extends Error {
  constructor(readonly corruption: LearnerLessonPersistedDataCorruption) {
    super("Learner lesson persisted data is corrupt")
  }
}

export function decodeLearnerLessonPersistedData(
  bundle: LearnerLessonPersistedRowBundle
): LearnerLessonPersistedDataDecodeResult {
  const steps: LessonStepDto[] = []

  for (const row of bundle.stepRows) {
    const decodedStep = decodeStep(row)

    if (decodedStep.kind === "corrupt") {
      return {
        corruption: {
          ...decodedStep.corruption,
          lessonId: bundle.lessonId,
        },
        kind: "corrupt",
      }
    }

    steps.push(decodedStep.value)
  }

  const parsedSummaryJson = parseJson(bundle.summaryJson)

  if (parsedSummaryJson.kind === "invalid-json") {
    return {
      corruption: {
        field: "lesson-summary",
        lessonId: bundle.lessonId,
        reason: "invalid-json",
      },
      kind: "corrupt",
    }
  }

  const summary = lessonSummarySchema.safeParse(parsedSummaryJson.value)

  if (!summary.success) {
    return {
      corruption: {
        field: "lesson-summary",
        lessonId: bundle.lessonId,
        reason: "schema-mismatch",
      },
      kind: "corrupt",
    }
  }

  return {
    kind: "decoded",
    value: {
      steps,
      summary: summary.data,
    },
  }
}

type StepDecodeResult =
  | { readonly kind: "decoded"; readonly value: LessonStepDto }
  | {
      readonly corruption: {
        readonly field: "lesson-step-content"
        readonly reason: "invalid-json" | "schema-mismatch"
        readonly stepId: string
      }
      readonly kind: "corrupt"
    }

function decodeStep(row: LearnerLessonPersistedStepRow): StepDecodeResult {
  const parsedContentJson = parseJson(row.contentJson)

  if (parsedContentJson.kind === "invalid-json") {
    return {
      corruption: {
        field: "lesson-step-content",
        reason: "invalid-json",
        stepId: row.id,
      },
      kind: "corrupt",
    }
  }

  const persistedContent = persistedStepContentSchema.safeParse(
    parsedContentJson.value
  )

  if (!persistedContent.success) {
    return createStepSchemaMismatch(row.id)
  }

  const { type: _persistedType, ...content } = persistedContent.data
  const step = lessonStepDtoSchema.safeParse({
    ...content,
    id: row.id,
    sortOrder: row.sortOrder,
    type: row.type,
  })

  return step.success
    ? { kind: "decoded", value: step.data }
    : createStepSchemaMismatch(row.id)
}

function createStepSchemaMismatch(stepId: string): StepDecodeResult {
  return {
    corruption: {
      field: "lesson-step-content",
      reason: "schema-mismatch",
      stepId,
    },
    kind: "corrupt",
  }
}

type JsonParseResult =
  | { readonly kind: "parsed"; readonly value: unknown }
  | { readonly kind: "invalid-json" }

function parseJson(json: string): JsonParseResult {
  try {
    return { kind: "parsed", value: JSON.parse(json) as unknown }
  } catch {
    return { kind: "invalid-json" }
  }
}
