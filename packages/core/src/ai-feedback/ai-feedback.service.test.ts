import { describe, expect, it, vi } from "vitest"

import type { ContentService, LessonDto } from "@/content"
import { lessonId } from "@/content"
import type { LearningRepository } from "@/learning"
import { userId } from "@/learning"

import type { AiFeedbackProvider } from "@/ai-feedback/ai-feedback.provider"
import type { AiFeedbackRepository } from "@/ai-feedback/ai-feedback.repository"
import { createAiFeedbackService } from "@/ai-feedback/ai-feedback.service"

const lesson: LessonDto = {
  id: "sentence-structure-01",
  title: "주어와 서술어 찾기",
  categoryId: "beginner",
  courseId: "sentence-structure",
  unitNumber: 1,
  steps: [
    {
      id: "sentence-structure-01-step-1",
      type: "SHORT_WRITE",
      order: 1,
      points: 10,
      required: true,
      content: {
        instruction: "문장을 고쳐 쓰세요.",
        prompt: "흐린 문장을 구체화하세요.",
        maxChars: 100,
        minChars: 5,
        referenceAnswer: "문장의 기준을 먼저 세웁니다.",
        aiEvaluationEnabled: true,
        showReferenceAfterSubmit: true,
      },
    },
    {
      id: "sentence-structure-01-step-2",
      type: "AI_FEEDBACK",
      order: 2,
      points: 0,
      required: true,
      content: {
        sourceStepId: "sentence-structure-01-step-1",
        feedbackPrompt: "명확성을 평가합니다.",
        focusAreas: ["clarity"],
        showScore: true,
        scoreRange: [0, 5],
        allowRevision: true,
        maxRevisions: 3,
      },
    },
  ],
}

const contentService: ContentService = {
  async listCourseCategories() {
    return { status: "ok", value: { categories: [] } }
  },
  async getCourseDetail() {
    return {
      status: "not-found",
      error: {
        code: "course-not-found",
        message: "코스를 찾을 수 없습니다.",
        courseId: "not-used",
      },
    }
  },
  async getLesson(targetLessonId) {
    if (targetLessonId !== "sentence-structure-01") {
      return {
        status: "not-found",
        error: {
          code: "lesson-not-found",
          message: "레슨을 찾을 수 없습니다.",
          lessonId: targetLessonId,
        },
      }
    }

    return { status: "ok", value: lesson }
  },
}

function createLearningRepository(): LearningRepository {
  return {
    completeLesson: vi.fn(),
    courseIncludesLesson: vi.fn(async () => true),
    findCourseProgress: vi.fn(),
    findLessonProgress: vi.fn(),
    listCourseLessonIds: vi.fn(async () => [lessonId("sentence-structure-01")]),
    listInProgressCourses: vi.fn(),
    listLessonAnswers: vi.fn(async () => [
      {
        answer: "저장된 답변",
        lessonId: lessonId("sentence-structure-01"),
        stepId: "sentence-structure-01-step-1",
      },
    ]),
    listLessonProgressByCourse: vi.fn(),
    upsertCourseProgress: vi.fn(),
    upsertLessonAnswer: vi.fn(),
    upsertLessonProgress: vi.fn(),
  }
}

function createFeedbackRepository(): AiFeedbackRepository {
  return {
    countCompletedAttempts: vi.fn(async () => 0),
    createCompletedAttempt: vi.fn(async () => undefined),
  }
}

function createProvider(): AiFeedbackProvider {
  return {
    createFeedback: vi.fn(async () => ({
      improvements: ["예시를 하나 더 추가하세요."],
      nextAction: "수정해 보기",
      score: 4,
      scoreRange: [0, 5] as [number, number],
      strengths: ["핵심이 분명합니다."],
      summary: "명확한 문장입니다.",
    })),
  }
}

describe("createAiFeedbackService", () => {
  it("creates feedback from a saved answer", async () => {
    const learningRepository = createLearningRepository()
    const feedbackRepository = createFeedbackRepository()
    const provider = createProvider()
    const service = createAiFeedbackService({
      contentService,
      feedbackRepository,
      learningRepository,
      provider,
    })

    const result = await service.createFeedback(userId("user-1"), {
      feedbackStepId: "sentence-structure-01-step-2",
      lessonId: "sentence-structure-01",
    })

    expect(result.status).toBe("ok")
    expect(provider.createFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: "저장된 답변",
        prompt: "명확성을 평가합니다.",
        scoreRange: [0, 5],
      })
    )
    expect(feedbackRepository.createCompletedAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        answerSnapshot: "저장된 답변",
        attemptNumber: 1,
        sourceStepId: "sentence-structure-01-step-1",
      })
    )
  })

  it("creates feedback from an explicit answer", async () => {
    const provider = createProvider()
    const service = createAiFeedbackService({
      contentService,
      feedbackRepository: createFeedbackRepository(),
      learningRepository: createLearningRepository(),
      provider,
    })

    await service.createFeedback(userId("user-1"), {
      answer: "요청 답변",
      feedbackStepId: "sentence-structure-01-step-2",
      lessonId: "sentence-structure-01",
    })

    expect(provider.createFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: "요청 답변",
      })
    )
  })

  it("returns answer-not-found when no answer is available", async () => {
    const provider = createProvider()
    const feedbackRepository = createFeedbackRepository()
    const service = createAiFeedbackService({
      contentService,
      feedbackRepository,
      learningRepository: {
        ...createLearningRepository(),
        listLessonAnswers: vi.fn(async () => []),
      },
      provider,
    })

    const result = await service.createFeedback(userId("user-1"), {
      feedbackStepId: "sentence-structure-01-step-2",
      lessonId: "sentence-structure-01",
    })

    expect(result).toEqual({
      status: "answer-not-found",
      error: {
        code: "answer-not-found",
        message: "답변을 찾을 수 없습니다.",
      },
    })
    expect(provider.createFeedback).not.toHaveBeenCalled()
    expect(feedbackRepository.createCompletedAttempt).not.toHaveBeenCalled()
  })

  it("returns feedback-retry-limit-exceeded after three completed attempts", async () => {
    const provider = createProvider()
    const service = createAiFeedbackService({
      contentService,
      feedbackRepository: {
        ...createFeedbackRepository(),
        countCompletedAttempts: vi.fn(async () => 3),
      },
      learningRepository: createLearningRepository(),
      provider,
    })

    const result = await service.createFeedback(userId("user-1"), {
      feedbackStepId: "sentence-structure-01-step-2",
      lessonId: "sentence-structure-01",
    })

    expect(result).toEqual({
      status: "retry-limit-exceeded",
      error: {
        code: "feedback-retry-limit-exceeded",
        message: "피드백 재시도 한도를 초과했습니다.",
      },
    })
    expect(provider.createFeedback).not.toHaveBeenCalled()
  })

  it("returns ai-feedback-unavailable when the provider fails", async () => {
    const provider: AiFeedbackProvider = {
      createFeedback: vi.fn(async () => {
        throw new Error("provider failed")
      }),
    }
    const feedbackRepository = createFeedbackRepository()
    const service = createAiFeedbackService({
      contentService,
      feedbackRepository,
      learningRepository: createLearningRepository(),
      provider,
    })

    const result = await service.createFeedback(userId("user-1"), {
      feedbackStepId: "sentence-structure-01-step-2",
      lessonId: "sentence-structure-01",
    })

    expect(result).toEqual({
      status: "unavailable",
      error: {
        code: "ai-feedback-unavailable",
        message: "인공지능 피드백을 사용할 수 없습니다.",
      },
    })
    expect(feedbackRepository.createCompletedAttempt).not.toHaveBeenCalled()
  })
})
