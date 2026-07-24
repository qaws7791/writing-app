import { describe, expect, it } from "vitest"

import { apiErrorSchema } from "#contracts/api-error"
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
import { answerableLessonStepTypeValues } from "#contracts/content/steps"

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
  it("answer·draft·evaluation registry가 canonical answerable 타입과 일치한다", () => {
    expect(Object.keys(learnerStepInteractionDefinitions).sort()).toEqual(
      [...answerableLessonStepTypeValues].sort()
    )
  })

  it("canonical 오류와 optional violations를 검증한다", () => {
    expect(
      apiErrorSchema.safeParse({
        code: "UNAUTHENTICATED",
        message: "로그인이 필요합니다.",
        requestId: "request-1",
      }).success
    ).toBe(true)
    expect(
      apiErrorSchema.safeParse({
        code: "VALIDATION_ERROR",
        message: "요청 내용을 확인해 주세요.",
        requestId: "request-2",
        violations: [{ message: "필수 값입니다.", path: "stepId" }],
      }).success
    ).toBe(true)
    expect(
      apiErrorSchema.safeParse({
        code: "UNAUTHENTICATED",
        message: "로그인이 필요합니다.",
        requestId: "request-1",
        unknown: true,
      }).success
    ).toBe(false)
  })

  it.each([
    "cause",
    "credential",
    "email",
    "password",
    "sql",
    "stack",
    "token",
  ])("공개 오류에서 민감한 내부 필드 %s를 거부한다", (field) => {
    expect(
      apiErrorSchema.safeParse({
        code: "INTERNAL_SERVER_ERROR",
        message: "요청을 처리할 수 없습니다.",
        requestId: "request-3",
        [field]: "sensitive",
      }).success
    ).toBe(false)
  })

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
    expect(
      completeLearnerStepBodySchema.safeParse({
        answer: {
          selectedOptionId: "option-1",
          type: "MULTIPLE_CHOICE",
        },
        kind: "answer",
      }).success
    ).toBe(true)
    expect(
      completeLearnerStepBodySchema.safeParse({
        kind: "skip-ai-feedback",
      }).success
    ).toBe(true)
    expect(
      completeLearnerStepBodySchema.safeParse({
        answer: { selectedIndexes: [0], type: "SELECT" },
        kind: "answer",
      }).success
    ).toBe(false)
    expect(
      completeLearnerStepResultSchema.safeParse({
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
      }).success
    ).toBe(true)
  })

  it.each(interactionCases)(
    "$type answer·partial draft·server evaluation 계약을 함께 검증한다",
    ({ draft, evaluation, submission, type }) => {
      const definition = learnerStepInteractionDefinitions[type]

      expect(definition.submissionSchema.safeParse(submission).success).toBe(
        true
      )
      expect(definition.draftSchema.safeParse(draft).success).toBe(true)
      expect(definition.evaluationSchema.safeParse(evaluation).success).toBe(
        true
      )
      expect(learnerStepSubmissionSchema.safeParse(submission).success).toBe(
        true
      )
      expect(learnerStepDraftAnswerSchema.safeParse(draft).success).toBe(true)
      expect(stepEvaluationSchema.safeParse(evaluation).success).toBe(true)
    }
  )

  it.each(interactionCases)(
    "$type 전용 계약은 다른 discriminator를 거부한다",
    ({ draft, evaluation, submission, type }) => {
      const definition = learnerStepInteractionDefinitions[type]

      expect(
        definition.submissionSchema.safeParse({
          ...submission,
          type: "READING",
        }).success
      ).toBe(false)
      expect(
        definition.draftSchema.safeParse({ ...draft, type: "AI_FEEDBACK" })
          .success
      ).toBe(false)
      expect(
        definition.evaluationSchema.safeParse({
          ...evaluation,
          type: "READING",
        }).success
      ).toBe(false)
    }
  )

  it("READING·COMPARE·AI_FEEDBACK에는 answer나 draft payload가 없다", () => {
    for (const type of ["READING", "COMPARE", "AI_FEEDBACK"] as const) {
      expect(
        learnerStepSubmissionSchema.safeParse({ text: "답안", type }).success
      ).toBe(false)
      expect(
        learnerStepDraftAnswerSchema.safeParse({ text: "", type }).success
      ).toBe(false)
    }
  })

  it("server draft의 revision·expected version과 복구 응답을 검증한다", () => {
    const body = {
      answer: { text: "저장 중인 글", type: "WRITE" },
      expectedCurriculumVersionId: "course-1-v1",
      expectedVersion: null,
    }
    const draft = {
      answer: body.answer,
      stepId: "step-1",
      updatedAt: "2026-07-22T15:00:00.000Z",
      version: 0,
    }

    expect(saveLearnerStepDraftBodySchema.safeParse(body).success).toBe(true)
    expect(
      saveLearnerStepDraftBodySchema.safeParse({
        ...body,
        expectedVersion: -1,
      }).success
    ).toBe(false)
    expect(
      startLearnerLessonResponseSchema.safeParse({
        completedSteps: 0,
        currentStepId: "step-1",
        currentStepIndex: 0,
        drafts: [draft],
        progressPercent: 0,
        status: "in_progress",
        totalSteps: 1,
        version: { curriculumVersionId: "course-1-v1", revision: 1 },
      }).success
    ).toBe(true)
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

    expect(learnerLessonResponseSchema.safeParse(lesson).success).toBe(true)
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
