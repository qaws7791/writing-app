import { describe, expect, it } from "vitest"

import {
  lessonStepDtoSchema,
  type LessonStepDto,
} from "@workspace/contracts/content/course"
import {
  contentAssetIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import { learnerLessonStepSchema } from "@workspace/contracts/learning/read-data"
import {
  learnerStepPresentationCases,
  learnerStepPresentationContext,
  learnerStepPresentationFutureSecret,
} from "#learning/test/fixtures/lesson-step-presentation-cases"

import { presentLearnerStep } from "#learning/infrastructure/persistence/learner-read-mapping"

describe("학습자 단계 보안 presenter", () => {
  it("READING asset ID를 canonical illustration과 대체 텍스트로 투영한다", () => {
    const assetId = contentAssetIdSchema.parse("reading-asset-1")
    const illustration = {
      altText: "문장 구조를 설명하는 삽화",
      id: assetId,
      kind: "reading-illustration" as const,
      url: "https://assets.example.test/reading.webp",
    }
    const presented = presentLearnerStep(
      lessonStepDtoSchema.parse({
        body: "본문",
        guide: "안내",
        id: "reading-with-image",
        illustrationAssetId: assetId,
        sortOrder: 1,
        title: "읽기",
        type: "READING",
      }),
      {
        ...learnerStepPresentationContext,
        assetReferencesById: new Map([[assetId, illustration]]),
      }
    )

    expect(presented).toMatchObject({ illustration })
    expect(learnerLessonStepSchema.safeParse(presented).success).toBe(true)
  })

  it.each(learnerStepPresentationCases)(
    "$name 공개 필드를 결정적으로 투영하고 계약 밖 값을 제거한다",
    ({ expected, step }) => {
      const inputSnapshot = structuredClone(step)
      const presented = presentLearnerStep(step, learnerStepPresentationContext)
      const replay = presentLearnerStep(step, learnerStepPresentationContext)

      expect(withItemsSortedById(presented)).toEqual(
        withItemsSortedById(expected)
      )
      expect(replay).toEqual(presented)
      expect(step).toEqual(inputSnapshot)
      expect(learnerLessonStepSchema.parse(presented)).toEqual(presented)
      expect(JSON.stringify(presented)).not.toContain(
        learnerStepPresentationFutureSecret
      )
    }
  )

  it("중첩 internal item의 미래 필드도 기본적으로 공개하지 않는다", () => {
    const step = {
      correct: "option-b",
      explanation: "서버 전용 해설",
      id: lessonStepIdSchema.parse("choice-1"),
      options: [
        { id: "option-a", text: "첫째" },
        { id: "option-b", text: "둘째" },
      ],
      question: "정답은?",
      sortOrder: 1,
      type: "MULTIPLE_CHOICE",
    } satisfies Extract<LessonStepDto, { type: "MULTIPLE_CHOICE" }>
    const stepWithNestedFutureField = {
      ...step,
      options: step.options.map((option) => ({
        ...option,
        futureOptionSecret: learnerStepPresentationFutureSecret,
      })),
    }

    const presented = presentLearnerStep(
      stepWithNestedFutureField,
      learnerStepPresentationContext
    )

    expect(collectObjectKeys(presented)).not.toContain("futureOptionSecret")
    expect(JSON.stringify(presented)).not.toContain(
      learnerStepPresentationFutureSecret
    )
  })
})

function withItemsSortedById(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(withItemsSortedById)
    return items.every(hasStableId)
      ? [...items].sort((left, right) => left.id.localeCompare(right.id))
      : items
  }
  if (typeof value !== "object" || value === null) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      withItemsSortedById(child),
    ])
  )
}

function hasStableId(value: unknown): value is { readonly id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { readonly id: unknown }).id === "string"
  )
}

function collectObjectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap(collectObjectKeys)
  if (typeof value !== "object" || value === null) return []

  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectObjectKeys(child),
  ])
}
