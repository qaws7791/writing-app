import { describe, expect, it } from "vitest"

import {
  learnerCourseListResponseSchema,
  learnerLessonResponseSchema,
} from "#contracts/learning/learner-api"
import {
  completeLearnerStepBodySchema,
  completeLearnerStepResultSchema,
  learnerStepDraftAnswerSchema,
  learnerStepSubmissionSchema,
  saveLearnerStepDraftBodySchema,
  startLearnerLessonResponseSchema,
  stepEvaluationSchema,
} from "#contracts/learning/learner-transition"
import { learnerStepInteractionDefinitions } from "#contracts/learning/learner-step-answer"

const interactionCases = [
  {
    draft: { selectedOptionId: null, type: "MULTIPLE_CHOICE" },
    evaluation: {
      correct: true,
      correctItemIds: ["option-1"],
      explanation: "해설",
      items: [{ id: "option-1", verdict: "correct" }],
      type: "MULTIPLE_CHOICE",
    },
    submission: { selectedOptionId: "option-1", type: "MULTIPLE_CHOICE" },
    type: "MULTIPLE_CHOICE",
  },
  {
    draft: { selectedChoiceIds: [], type: "FILL_BLANK" },
    evaluation: {
      correct: true,
      correctItemIds: ["word-1"],
      explanation: "해설",
      items: [{ id: "word-1", verdict: "correct" }],
      type: "FILL_BLANK",
    },
    submission: { selectedChoiceIds: ["word-1"], type: "FILL_BLANK" },
    type: "FILL_BLANK",
  },
  {
    draft: { selectedItemIds: [], type: "SELECT" },
    evaluation: {
      correct: true,
      correctItemIds: ["segment-1"],
      explanation: "해설",
      items: [{ id: "segment-1", verdict: "correct" }],
      type: "SELECT",
    },
    submission: { selectedItemIds: ["segment-1"], type: "SELECT" },
    type: "SELECT",
  },
  {
    draft: { orderedItemIds: [], type: "ORDER" },
    evaluation: {
      correct: true,
      correctItemIds: ["item-1"],
      explanation: "해설",
      items: [{ id: "item-1", verdict: "correct" }],
      type: "ORDER",
    },
    submission: { orderedItemIds: ["item-1"], type: "ORDER" },
    type: "ORDER",
  },
  {
    draft: { text: "", type: "WRITE" },
    evaluation: { accepted: true, type: "WRITE" },
    submission: { text: "답안", type: "WRITE" },
    type: "WRITE",
  },
  {
    draft: { pairs: [], type: "MATCH" },
    evaluation: {
      correct: true,
      explanation: "해설",
      items: [
        {
          expectedRightItemId: "right-1",
          leftItemId: "left-1",
          rightItemId: "right-1",
          verdict: "correct",
        },
      ],
      type: "MATCH",
    },
    submission: {
      pairs: [{ leftItemId: "left-1", rightItemId: "right-1" }],
      type: "MATCH",
    },
    type: "MATCH",
  },
  {
    draft: { assignments: [], type: "CATEGORIZE" },
    evaluation: {
      correct: true,
      explanation: "해설",
      items: [
        {
          categoryId: "category-1",
          expectedCategoryId: "category-1",
          itemId: "item-1",
          verdict: "correct",
        },
      ],
      type: "CATEGORIZE",
    },
    submission: {
      assignments: [{ categoryId: "category-1", itemId: "item-1" }],
      type: "CATEGORIZE",
    },
    type: "CATEGORIZE",
  },
] as const

describe("학습자 API canonical 계약", () => {
  it("요청의 root와 union 내부 알 수 없는 필드를 거절한다", () => {
    expect(
      learnerStepSubmissionSchema.safeParse({
        selectedOptionId: "option-1",
        type: "MULTIPLE_CHOICE",
        unknown: true,
      }).success
    ).toBe(false)
    expect(
      completeLearnerStepBodySchema.safeParse({
        answer: {
          selectedOptionId: "option-1",
          type: "MULTIPLE_CHOICE",
        },
        kind: "answer",
        unknown: true,
      }).success
    ).toBe(false)
  })

  it("응답 객체의 계약 외 필드를 거절한다", () => {
    expect(
      learnerCourseListResponseSchema.safeParse({
        items: [],
        internal: true,
        nextCursor: null,
      }).success
    ).toBe(false)
  })

  it("새 단계 완료 요청은 stable item ID와 명시적 intent만 허용한다", () => {
    expect(() =>
      completeLearnerStepBodySchema.parse({
        answer: {
          selectedOptionId: "option-1",
          type: "MULTIPLE_CHOICE",
        },
        kind: "answer",
      })
    ).not.toThrow()
    expect(() =>
      completeLearnerStepBodySchema.parse({ kind: "skip-ai-feedback" })
    ).not.toThrow()
    expect(
      completeLearnerStepBodySchema.safeParse({
        answer: { selectedIndexes: [0], type: "SELECT" },
        kind: "answer",
      }).success
    ).toBe(false)
  })

  it("단계 완료 결과는 진행 상태와 평가를 함께 담는다", () => {
    expect(() =>
      completeLearnerStepResultSchema.parse({
        evaluation: null,
        learning: {
          completedSteps: 1,
          currentStepId: "step-2",
          currentStepIndex: 1,
          progressPercent: 50,
          status: "in_progress",
          totalSteps: 2,
          version: { curriculumVersionId: "curriculum:c1:1", revision: 1 },
        },
        status: "advanced",
      })
    ).not.toThrow()
  })

  it.each(interactionCases)(
    "$type 제출은 전용 계약과 union 계약을 함께 통과한다",
    ({ submission, type }) => {
      const definition = learnerStepInteractionDefinitions[type]

      expect(() => definition.submissionSchema.parse(submission)).not.toThrow()
      expect(() => learnerStepSubmissionSchema.parse(submission)).not.toThrow()
    }
  )

  it.each(interactionCases)(
    "$type 부분 draft는 전용 계약과 union 계약을 함께 통과한다",
    ({ draft, type }) => {
      const definition = learnerStepInteractionDefinitions[type]

      expect(() => definition.draftSchema.parse(draft)).not.toThrow()
      expect(() => learnerStepDraftAnswerSchema.parse(draft)).not.toThrow()
    }
  )

  it.each(interactionCases)(
    "$type 서버 평가는 전용 계약과 union 계약을 함께 통과한다",
    ({ evaluation, type }) => {
      const definition = learnerStepInteractionDefinitions[type]

      expect(() => definition.evaluationSchema.parse(evaluation)).not.toThrow()
      expect(() => stepEvaluationSchema.parse(evaluation)).not.toThrow()
    }
  )

  it.each(["READING", "COMPARE", "AI_FEEDBACK"] as const)(
    "%s 단계는 answer payload를 받지 않는다",
    (type) => {
      expect(
        learnerStepSubmissionSchema.safeParse({ text: "답안", type }).success
      ).toBe(false)
      expect(
        learnerStepDraftAnswerSchema.safeParse({ text: "", type }).success
      ).toBe(false)
    }
  )

  it("draft 저장 요청은 음수 expected version을 거절한다", () => {
    const body = {
      answer: { text: "저장 중인 글", type: "WRITE" },
      expectedCurriculumVersionId: "course-1-v1",
      expectedVersion: null,
    }

    expect(() => saveLearnerStepDraftBodySchema.parse(body)).not.toThrow()
    expect(
      saveLearnerStepDraftBodySchema.safeParse({
        ...body,
        expectedVersion: -1,
      }).success
    ).toBe(false)
  })

  it("레슨 시작 응답은 복구할 draft를 함께 담는다", () => {
    expect(() =>
      startLearnerLessonResponseSchema.parse({
        completedSteps: 0,
        currentStepId: "step-1",
        currentStepIndex: 0,
        drafts: [
          {
            answer: { text: "저장 중인 글", type: "WRITE" },
            stepId: "step-1",
            updatedAt: "2026-07-22T15:00:00.000Z",
            version: 0,
          },
        ],
        progressPercent: 0,
        status: "in_progress",
        totalSteps: 1,
        version: { curriculumVersionId: "course-1-v1", revision: 1 },
      })
    ).not.toThrow()
  })

  it("공개 lesson step은 solution field를 거절한다", () => {
    const lesson = {
      category: "입문",
      courseId: "course-1",
      description: "설명",
      drafts: [],
      estimatedMinutes: 5,
      id: "lesson-1",
      learning: {
        status: "not_started",
        totalSteps: 1,
        version: { curriculumVersionId: "course-1-v1", revision: 1 },
      },
      steps: [
        {
          id: "step-1",
          options: [
            { id: "option-1", text: "첫째" },
            { id: "option-2", text: "둘째" },
          ],
          question: "질문",
          sortOrder: 1,
          type: "MULTIPLE_CHOICE",
        },
      ],
      summary: [],
      title: "레슨",
      unitId: "unit-1",
      version: { curriculumVersionId: "course-1-v1", revision: 1 },
    }

    expect(() => learnerLessonResponseSchema.parse(lesson)).not.toThrow()
    expect(
      learnerLessonResponseSchema.safeParse({
        ...lesson,
        steps: [
          {
            ...lesson.steps[0],
            correct: "option-1",
            explanation: "정답 해설",
          },
        ],
      }).success
    ).toBe(false)
  })
})
