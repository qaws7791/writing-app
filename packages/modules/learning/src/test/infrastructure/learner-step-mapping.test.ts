import { describe, expect, it } from "vitest"

import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import { contentAssetIdSchema } from "@workspace/contracts/content/ids"
import { learnerLessonStepSchema } from "@workspace/contracts/learning/read-data"
import {
  learnerStepPresentationCases,
  learnerStepPresentationContext,
  learnerStepPresentationFutureSecret,
} from "#learning/test/fixtures/lesson-step-presentation-cases"

import { presentLearnerStep } from "#learning/infrastructure/persistence/learner-read-mapping"

const futureSecret = learnerStepPresentationFutureSecret
const context = learnerStepPresentationContext
const presentationCases = learnerStepPresentationCases

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
        ...context,
        assetReferencesById: new Map([[assetId, illustration]]),
      }
    )

    expect(presented).toMatchObject({ illustration })
    expect(learnerLessonStepSchema.safeParse(presented).success).toBe(true)
  })

  it.each(presentationCases)(
    "$name 공개 허용 목록만 결정적으로 투영한다",
    ({ expected, forbiddenKeys, step }) => {
      const inputSnapshot = structuredClone(step)
      const first = presentLearnerStep(step, context)
      const replay = presentLearnerStep(step, context)

      expect(first).toEqual(expected)
      expect(replay).toEqual(first)
      expect(step).toEqual(inputSnapshot)
      expect(learnerLessonStepSchema.parse(first)).toEqual(first)
      expect(collectObjectKeys(first)).not.toEqual(
        expect.arrayContaining([...forbiddenKeys])
      )
      expect(JSON.stringify(first)).not.toContain(futureSecret)
    }
  )

  it("중첩 internal item의 미래 필드도 기본적으로 공개하지 않는다", () => {
    const step = lessonStepDtoSchema.parse({
      correct: "option-b",
      explanation: "서버 전용 해설",
      id: "choice-1",
      options: [
        { id: "option-a", text: "첫째" },
        { id: "option-b", text: "둘째" },
      ],
      question: "정답은?",
      sortOrder: 1,
      type: "MULTIPLE_CHOICE",
    })
    if (step.type !== "MULTIPLE_CHOICE") {
      throw new Error("Expected multiple choice fixture")
    }
    const stepWithNestedFutureField = {
      ...step,
      options: step.options.map((option) => ({
        ...option,
        futureOptionSecret: futureSecret,
      })),
    }

    const presented = presentLearnerStep(stepWithNestedFutureField, context)

    expect(collectObjectKeys(presented)).not.toContain("futureOptionSecret")
    expect(JSON.stringify(presented)).not.toContain(futureSecret)
  })

  it.each([
    {
      step: {
        answer: ["정답"],
        explanation: "해설",
        id: "blank-missing-id",
        sortOrder: 1,
        template: "___",
        type: "FILL_BLANK",
        words: ["정답"],
      },
      type: "FILL_BLANK",
    },
    {
      step: {
        correct: [0],
        explanation: "해설",
        id: "select-missing-id",
        question: "질문",
        segments: ["구간"],
        sortOrder: 1,
        type: "SELECT",
      },
      type: "SELECT",
    },
    {
      step: {
        correct: ["문장"],
        explanation: "해설",
        id: "order-missing-id",
        items: ["문장"],
        sortOrder: 1,
        title: "순서",
        type: "ORDER",
      },
      type: "ORDER",
    },
    {
      step: {
        explanation: "해설",
        guide: "안내",
        id: "match-missing-id",
        pairs: [{ left: "왼쪽", right: "오른쪽" }],
        sortOrder: 1,
        title: "짝",
        type: "MATCH",
      },
      type: "MATCH",
    },
  ] as const)("$type stable item ID가 없으면 계약에서 거부한다", ({ step }) => {
    expect(lessonStepDtoSchema.safeParse(step).success).toBe(false)
  })
})

function collectObjectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap(collectObjectKeys)
  if (typeof value !== "object" || value === null) return []

  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectObjectKeys(child),
  ])
}
