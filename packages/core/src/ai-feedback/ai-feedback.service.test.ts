import { describe, expect, it } from "vitest"

import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/core/content"
import { lessonDtoSchema, type LessonDto } from "@workspace/core/content"
import type { ContentRepository } from "@workspace/core/content"
import { learnerIdSchema } from "@workspace/core/learning"
import {
  createAiFeedbackService,
  type AiFeedbackService,
} from "@/ai-feedback/ai-feedback.service"
import type {
  AiFeedbackAttemptRecord,
  AiFeedbackRepository,
} from "@/ai-feedback/ai-feedback.repository"
import type {
  AiFeedbackProvider,
  AiFeedbackProviderInput,
} from "@/ai-feedback/ai-feedback.provider"
import { err, ok } from "@/result"

const occurredAt = new Date("2026-06-14T10:00:00.000Z")
const learnerId = learnerIdSchema.parse("user-1")
const lessonId = lessonIdSchema.parse("l1")
const stepId = lessonStepIdSchema.parse("l1-s2")

describe("AI 피드백 서비스", () => {
  it("OpenAI 결과를 Kwep AI 코칭 응답 DTO로 정렬하고 남은 시도 횟수를 계산한다", async () => {
    const savedAttempts: AiFeedbackAttemptRecord[] = []
    const providerInputs: AiFeedbackProviderInput[] = []
    const service = createService({
      completedAttempts: 1,
      providerInputs,
      savedAttempts,
    })

    await expect(
      service.createFeedback({
        answer: "문장을 더 분명하게 고쳐 보았습니다.",
        lessonId,
        occurredAt,
        stepId,
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "ok",
      value: {
        improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
        nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
        remainingAttempts: 1,
        score: 82,
        scoreRange: [0, 100],
        showScore: true,
        strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
        summary: "문장의 의도가 분명합니다.",
      },
    })

    expect(providerInputs).toEqual([
      {
        input: [
          "레슨 제목: 좋은 문장이란 무엇인가",
          "코칭 초점: 명확성",
          "학습자 답변:",
          "문장을 더 분명하게 고쳐 보았습니다.",
        ].join("\n"),
        instructions: [
          "당신은 한국어 글쓰기 학습자를 돕는 코치입니다.",
          "답변은 반드시 JSON schema에 맞춰 한국어로 작성합니다.",
          "칭찬은 구체적으로, 개선점은 다음 시도에서 바로 적용할 수 있게 씁니다.",
          "점수는 0부터 100 사이 정수로 판단합니다.",
        ].join("\n"),
        policyVersion: "kwep-writing-coach-v1",
      },
    ])
    expect(savedAttempts).toEqual([
      {
        answer: "문장을 더 분명하게 고쳐 보았습니다.",
        attemptNumber: 2,
        lessonId,
        occurredAt,
        result: {
          improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
          nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
          score: 82,
          scoreRange: [0, 100],
          showScore: true,
          strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
          summary: "문장의 의도가 분명합니다.",
        },
        stepId,
        userId: learnerId,
      },
    ])
  })

  it("세 번째 완료 이후에는 provider 호출 없이 시도 제한 오류를 반환한다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const savedAttempts: AiFeedbackAttemptRecord[] = []
    const service = createService({
      completedAttempts: 3,
      providerInputs,
      savedAttempts,
    })

    await expect(
      service.createFeedback({
        answer: "네 번째 코칭을 요청합니다.",
        lessonId,
        occurredAt,
        stepId,
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "attempt-limit-exceeded",
        remainingAttempts: 0,
      },
    })

    expect(providerInputs).toEqual([])
    expect(savedAttempts).toEqual([])
  })

  it("저장 시점에 시도 한도를 넘으면 provider 결과를 500으로 만들지 않고 제한 오류를 반환한다", async () => {
    const providerInputs: AiFeedbackProviderInput[] = []
    const savedAttempts: AiFeedbackAttemptRecord[] = []
    const service = createService({
      completedAttempts: 2,
      providerInputs,
      saveResult: {
        completedAttempts: 3,
        kind: "limit-exceeded",
      },
      savedAttempts,
    })

    await expect(
      service.createFeedback({
        answer: "동시에 세 번째 코칭을 요청합니다.",
        lessonId,
        occurredAt,
        stepId,
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "attempt-limit-exceeded",
        remainingAttempts: 0,
      },
    })

    expect(providerInputs).toHaveLength(1)
    expect(savedAttempts).toEqual([])
  })

  it("provider 실패는 저장하지 않고 시도 횟수를 소모하지 않는다", async () => {
    const savedAttempts: AiFeedbackAttemptRecord[] = []
    const providerInputs: AiFeedbackProviderInput[] = []
    const service = createService({
      completedAttempts: 2,
      providerInputs,
      providerResult: err({ kind: "provider-unavailable" }),
      savedAttempts,
    })

    await expect(
      service.createFeedback({
        answer: "다시 코칭을 요청합니다.",
        lessonId,
        occurredAt,
        stepId,
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "provider-failed",
        remainingAttempts: 1,
      },
    })

    expect(providerInputs).toHaveLength(1)
    expect(savedAttempts).toEqual([])
  })

  it("AI_FEEDBACK이 아닌 스텝은 invalid-request로 거절한다", async () => {
    const service = createService()

    await expect(
      service.createFeedback({
        answer: "읽기 스텝에 코칭을 요청합니다.",
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
  })
})

function createService({
  completedAttempts = 0,
  providerInputs = [],
  providerResult = ok({
    improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
    nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
    score: 82,
    scoreRange: [0, 100] as const,
    showScore: true,
    strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
    summary: "문장의 의도가 분명합니다.",
  }),
  saveResult,
  savedAttempts = [],
}: {
  readonly completedAttempts?: number
  readonly providerInputs?: AiFeedbackProviderInput[]
  readonly providerResult?: Awaited<
    ReturnType<AiFeedbackProvider["createFeedback"]>
  >
  readonly saveResult?: Awaited<
    ReturnType<AiFeedbackRepository["saveCompletedAttempt"]>
  >
  readonly savedAttempts?: AiFeedbackAttemptRecord[]
} = {}): AiFeedbackService {
  const contentRepository: ContentRepository = {
    async findCourseDetail() {
      return null
    },
    async findLesson(requestedLessonId) {
      return requestedLessonId === lessonId ? lesson : null
    },
    async listCourses() {
      return []
    },
  }
  const feedbackRepository: AiFeedbackRepository = {
    async countCompletedAttempts() {
      return completedAttempts
    },
    async saveCompletedAttempt(record) {
      const attemptNumber =
        saveResult?.kind === "saved"
          ? saveResult.attemptNumber
          : completedAttempts + savedAttempts.length + 1

      if (saveResult?.kind === "limit-exceeded") {
        return saveResult
      }

      savedAttempts.push({
        ...record,
        attemptNumber,
      })

      return saveResult ?? { attemptNumber, kind: "saved" }
    },
  }
  const provider: AiFeedbackProvider = {
    async createFeedback(input) {
      providerInputs.push(input)
      return providerResult
    },
  }

  return createAiFeedbackService({
    contentRepository,
    feedbackRepository,
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
      id: "l1-s1",
      sortOrder: 1,
      title: "명료성의 원칙",
      type: "READING",
    },
    {
      allowRetry: true,
      feedback: "주장과 근거가 명확히 구분되어 있습니다.",
      focus: "명확성",
      id: stepId,
      score: 92,
      scoreMax: 100,
      showScore: true,
      sortOrder: 2,
      target: "l1-s-write",
      type: "AI_FEEDBACK",
    },
  ],
  summary: ["좋은 문장은 모호하지 않다"],
  title: "좋은 문장이란 무엇인가",
  unitId: unitIdSchema.parse("u1"),
})
