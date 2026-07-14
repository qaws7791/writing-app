import { describe, expect, it } from "vitest"

import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "#core/modules/content/domain/content.ids"
import {
  lessonDtoSchema,
  type LessonDto,
} from "#core/modules/content/domain/content.dto"
import type { ContentRepository } from "#core/modules/content/application/ports/content.repository"
import { learnerIdSchema } from "#core/modules/learning/domain/learning.ids"
import {
  createAiFeedbackService,
  type AiFeedbackService,
} from "#core/modules/ai-feedback/application/use-cases/ai-feedback.service"
import { defaultAiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackRepository } from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import type { LearningRepository } from "#core/modules/learning/application/ports/learning.repository"
import type { LearningAnswer } from "#core/modules/learning/domain/learning.dto"
import type {
  AiFeedbackProvider,
  AiFeedbackProviderInput,
} from "#core/modules/ai-feedback/application/ports/ai-feedback.provider"
import { ok } from "#core/shared/result"

const occurredAt = new Date("2026-06-14T10:00:00.000Z")
const learnerId = learnerIdSchema.parse("user-1")
const lessonId = lessonIdSchema.parse("l1")
const stepId = lessonStepIdSchema.parse("l1-s3")

describe("AI 피드백 서비스", () => {
  it("AI_FEEDBACK 스텝의 레슨 맥락으로 피드백 시도를 조정한다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const service = createService({ providerInputs })

    await expect(
      service.createFeedback({
        idempotencyKey: "request-1",
        lessonId,
        occurredAt,
        stepId,
        userId: learnerId,
      })
    ).resolves.toMatchObject({
      kind: "ok",
      value: {
        remainingAttempts: 2,
        summary: "문장의 의도가 분명합니다.",
      },
    })

    expect(providerInputs[0]).toMatchObject({
      input: [
        "레슨 제목: 좋은 문장이란 무엇인가",
        "코칭 초점: 명확성",
        "학습자 답변:",
        "문장을 더 분명하게 고쳐 보았습니다.",
      ].join("\n"),
    })
  })

  it("lesson이 없으면 피드백 시도를 시작하지 않고 lesson-not-found를 반환한다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const service = createService({
      lessonResult: null,
      providerInputs,
    })

    await expect(
      service.createFeedback({
        idempotencyKey: "request-2",
        lessonId,
        occurredAt,
        stepId,
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "lesson-not-found",
        lessonId,
      },
    })
    expect(providerInputs).toEqual([])
  })

  it("AI_FEEDBACK이 아닌 스텝은 invalid-request로 거절한다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const service = createService({ providerInputs })

    await expect(
      service.createFeedback({
        idempotencyKey: "request-3",
        lessonId,
        occurredAt,
        stepId: lessonStepIdSchema.parse("l1-s1"),
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "invalid-request",
        reason: "step-feedback-not-supported",
        stepId: lessonStepIdSchema.parse("l1-s1"),
      },
    })
    expect(providerInputs).toEqual([])
  })

  it("lesson에 속하지 않은 stepId는 invalid-request로 거절한다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const service = createService({ providerInputs })

    await expect(
      service.createFeedback({
        idempotencyKey: "request-4",
        lessonId,
        occurredAt,
        stepId: lessonStepIdSchema.parse("missing-step"),
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "invalid-request",
        reason: "step-not-found-in-lesson",
        stepId: lessonStepIdSchema.parse("missing-step"),
      },
    })
    expect(providerInputs).toEqual([])
  })

  it("target WRITE 답변이 저장되지 않았으면 provider를 호출하지 않는다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const service = createService({ providerInputs, targetAnswer: null })

    await expect(
      service.createFeedback({
        idempotencyKey: "request-5",
        lessonId,
        occurredAt,
        stepId,
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "feedback-answer-not-found",
        targetStepId: lessonStepIdSchema.parse("l1-s2"),
      },
    })
    expect(providerInputs).toEqual([])
  })

  it("AI_FEEDBACK target이 유효하지 않으면 명시적인 설정 오류를 반환한다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const missingTargetId = lessonStepIdSchema.parse("missing-target")
    const invalidLesson: LessonDto = {
      ...lesson,
      steps: lesson.steps.map((step) =>
        step.type === "AI_FEEDBACK"
          ? { ...step, target: missingTargetId }
          : step
      ),
    }
    const service = createService({
      lessonResult: invalidLesson,
      providerInputs,
    })

    await expect(
      service.createFeedback({
        idempotencyKey: "request-invalid-target",
        lessonId,
        occurredAt,
        stepId,
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "feedback-target-invalid",
        reason: "target-step-not-found",
        stepId,
      },
    })
    expect(providerInputs).toEqual([])
  })
})

function createService({
  lessonResult = lesson,
  providerInputs = [],
  targetAnswer = {
    text: "문장을 더 분명하게 고쳐 보았습니다.",
    type: "WRITE",
  },
}: {
  readonly lessonResult?: LessonDto | null
  readonly providerInputs?: AiFeedbackProviderInput[]
  readonly targetAnswer?: LearningAnswer | null
} = {}): AiFeedbackService {
  const contentRepository: ContentRepository = {
    async findCourseDetail() {
      return null
    },
    async findLesson(requestedLessonId) {
      return requestedLessonId === lessonId ? lessonResult : null
    },
    async listCourses() {
      return []
    },
  }
  const feedbackRepository: AiFeedbackRepository = {
    async markAttemptFailed() {
      return true
    },
    async markAttemptSucceeded() {
      return true
    },
    async reserveAttempt(input) {
      return {
        attemptId: input.attemptId,
        attemptNumber: 1,
        completedAttempts: 0,
        expiredAttempts: [],
        kind: "reserved",
      }
    },
  }
  const learningRepository: LearningRepository = {
    async completeLesson() {},
    async findLessonProgress() {
      return null
    },
    async findStepAnswer(query) {
      return query.stepId === "l1-s2" ? targetAnswer : null
    },
    async saveLessonProgress(command) {
      return {
        currentStepIndex: command.currentStepIndex,
        kind: "saved",
        status: "in_progress",
      }
    },
    async saveStepAnswer() {},
  }
  const provider: AiFeedbackProvider = {
    async createFeedback(input) {
      providerInputs.push(input)
      return ok({
        improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
        nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
        score: 82,
        scoreRange: [0, 100],
        showScore: true,
        strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
        summary: "문장의 의도가 분명합니다.",
      })
    },
  }

  return createAiFeedbackService({
    attemptPolicy: defaultAiFeedbackAttemptPolicy,
    contentRepository,
    feedbackRepository,
    learningRepository,
    provider,
  })
}

const lesson: LessonDto = lessonDtoSchema.parse({
  category: "문장의 기본기",
  courseId: courseIdSchema.parse("c1"),
  description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
  estimatedMinutes: 5,
  id: lessonId,
  steps: [
    {
      body: "좋은 문장은 한 가지 의미를 분명히 전달합니다.",
      guide: "좋은 문장의 기준을 읽습니다.",
      id: lessonStepIdSchema.parse("l1-s1"),
      sortOrder: 1,
      title: "명료성의 원칙",
      type: "READING",
    },
    {
      context: "주장과 근거를 한 문장으로 구성하세요.",
      draft: true,
      id: lessonStepIdSchema.parse("l1-s2"),
      max: 300,
      min: 20,
      sortOrder: 2,
      topic: "제품의 주장과 근거",
      type: "WRITE",
    },
    {
      allowRetry: true,
      feedback: "주장과 근거가 명확히 구분되어 있습니다.",
      focus: "명확성",
      id: stepId,
      score: 92,
      scoreMax: 100,
      showScore: true,
      sortOrder: 3,
      target: lessonStepIdSchema.parse("l1-s2"),
      type: "AI_FEEDBACK",
    },
  ],
  summary: ["좋은 문장은 모호하지 않다"],
  title: "좋은 문장이란 무엇인가",
  unitId: unitIdSchema.parse("u1"),
})
