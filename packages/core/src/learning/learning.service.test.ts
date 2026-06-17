import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/core/content"
import { lessonDtoSchema, type LessonDto } from "@workspace/core/content"
import type { ContentRepository } from "@workspace/core/content"
import { learnerIdSchema } from "@/learning/learning.ids"
import {
  createLearningService,
  type LearningService,
} from "@/learning/learning.service"
import type {
  LearningRepository,
  SaveStepAnswerCommand,
} from "@/learning/learning.repository"

const occurredAt = new Date("2026-06-14T09:30:00.000Z")
const learnerId = learnerIdSchema.parse("user-1")
const lessonId = lessonIdSchema.parse("l1")

describe("학습 서비스", () => {
  it("스텝 답변 구조 검증을 수동 타입 리더가 아니라 Zod 스키마로 처리한다", () => {
    const source = readFileSync(
      new URL("./learning.service.ts", import.meta.url),
      "utf8"
    )

    expect(source).not.toContain("function readTypedObject")
    expect(source).not.toContain("function readStringArray")
    expect(source).not.toContain("function readNumberArray")
    expect(source).not.toContain("function readObjectArray")
  })

  it("Kwep 답변 가능 스텝 타입과 일치하는 저장 요청을 허용한다", async () => {
    const savedAnswers: SaveStepAnswerCommand[] = []
    const service = createService({
      savedAnswers,
    })

    const answers = [
      {
        answer: { selectedOptionId: "b", type: "MULTIPLE_CHOICE" },
        stepId: "l1-s3",
      },
      {
        answer: { selectedWords: ["관찰"], type: "FILL_BLANK" },
        stepId: "l1-s4",
      },
      {
        answer: { selectedIndexes: [0, 1], type: "SELECT" },
        stepId: "l1-s5",
      },
      {
        answer: { orderedItems: ["나는", "책을", "읽었다"], type: "ORDER" },
        stepId: "l1-s6",
      },
      {
        answer: { text: "나의 문장 답변", type: "WRITE" },
        stepId: "l1-s7",
      },
      {
        answer: { requested: true, type: "AI_FEEDBACK" },
        stepId: "l1-s8",
      },
      {
        answer: {
          pairs: [{ left: "그러나", right: "역접" }],
          type: "MATCH",
        },
        stepId: "l1-s9",
      },
      {
        answer: {
          items: [{ categoryId: "A", itemId: "i1" }],
          type: "CATEGORIZE",
        },
        stepId: "l1-s10",
      },
    ] as const

    for (const answer of answers) {
      await expect(
        service.saveStepAnswer({
          answer: answer.answer,
          lessonId,
          occurredAt,
          stepId: lessonStepIdSchema.parse(answer.stepId),
          userId: learnerId,
        })
      ).resolves.toEqual({
        kind: "ok",
        value: {
          saved: true,
        },
      })
    }

    expect(savedAnswers).toHaveLength(8)
    expect(savedAnswers.map((answer) => answer.stepId)).toEqual([
      "l1-s3",
      "l1-s4",
      "l1-s5",
      "l1-s6",
      "l1-s7",
      "l1-s8",
      "l1-s9",
      "l1-s10",
    ])
  })

  it("문자열화된 스텝 답변은 invalid-request로 거절한다", async () => {
    const service = createService()

    await expect(
      service.saveStepAnswer({
        answer: JSON.stringify({
          selectedOptionId: "b",
          type: "MULTIPLE_CHOICE",
        }),
        lessonId,
        occurredAt,
        stepId: lessonStepIdSchema.parse("l1-s3"),
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "invalid-request",
        reason: "step-answer-shape-invalid",
        stepId: lessonStepIdSchema.parse("l1-s3"),
      },
    })
  })

  it("첫 읽기 스텝의 lesson-started 마커 저장을 허용한다", async () => {
    const savedAnswers: SaveStepAnswerCommand[] = []
    const service = createService({
      savedAnswers,
    })

    await expect(
      service.saveStepAnswer({
        answer: { kind: "lesson-started" },
        lessonId,
        occurredAt,
        stepId: lessonStepIdSchema.parse("l1-s1"),
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "ok",
      value: {
        saved: true,
      },
    })

    expect(savedAnswers[0]?.answer).toEqual({ kind: "lesson-started" })
  })

  it("스텝 타입과 답변 타입이 다르면 invalid-request로 거절한다", async () => {
    const service = createService()

    await expect(
      service.saveStepAnswer({
        answer: { text: "객관식에 쓰기 답변", type: "WRITE" },
        lessonId,
        occurredAt,
        stepId: lessonStepIdSchema.parse("l1-s3"),
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "invalid-request",
        reason: "step-answer-shape-invalid",
        stepId: lessonStepIdSchema.parse("l1-s3"),
      },
    })
  })

  it("스텝 콘텐츠에 없는 선택형 답변은 저장하지 않는다", async () => {
    const savedAnswers: SaveStepAnswerCommand[] = []
    const service = createService({
      savedAnswers,
    })

    await expect(
      service.saveStepAnswer({
        answer: {
          selectedIndexes: [0, 4],
          type: "SELECT",
        },
        lessonId,
        occurredAt,
        stepId: lessonStepIdSchema.parse("l1-s5"),
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "invalid-request",
        reason: "step-answer-invalid",
        stepId: lessonStepIdSchema.parse("l1-s5"),
      },
    })
    expect(savedAnswers).toEqual([])
  })

  it("중복되거나 존재하지 않는 순서 배열 답변은 저장하지 않는다", async () => {
    const savedAnswers: SaveStepAnswerCommand[] = []
    const service = createService({
      savedAnswers,
    })

    await expect(
      service.saveStepAnswer({
        answer: {
          orderedItems: ["나는", "나는", "없는 항목"],
          type: "ORDER",
        },
        lessonId,
        occurredAt,
        stepId: lessonStepIdSchema.parse("l1-s6"),
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "invalid-request",
        reason: "step-answer-invalid",
        stepId: lessonStepIdSchema.parse("l1-s6"),
      },
    })
    expect(savedAnswers).toEqual([])
  })

  it("존재하지 않는 분류 항목과 카테고리 답변은 저장하지 않는다", async () => {
    const savedAnswers: SaveStepAnswerCommand[] = []
    const service = createService({
      savedAnswers,
    })

    await expect(
      service.saveStepAnswer({
        answer: {
          items: [
            { categoryId: "A", itemId: "i1" },
            { categoryId: "missing-category", itemId: "missing-item" },
          ],
          type: "CATEGORIZE",
        },
        lessonId,
        occurredAt,
        stepId: lessonStepIdSchema.parse("l1-s10"),
        userId: learnerId,
      })
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "invalid-request",
        reason: "step-answer-invalid",
        stepId: lessonStepIdSchema.parse("l1-s10"),
      },
    })
    expect(savedAnswers).toEqual([])
  })

  it("읽기와 비교 스텝 저장 요청은 invalid-request로 거절한다", async () => {
    const service = createService()

    for (const stepId of ["l1-s1", "l1-s2"]) {
      await expect(
        service.saveStepAnswer({
          answer: { read: true },
          lessonId,
          occurredAt,
          stepId: lessonStepIdSchema.parse(stepId),
          userId: learnerId,
        })
      ).resolves.toEqual({
        kind: "err",
        error: {
          kind: "invalid-request",
          reason: "step-answer-not-supported",
          stepId: lessonStepIdSchema.parse(stepId),
        },
      })
    }
  })

  it("lesson에 속하지 않은 stepId 저장 요청은 invalid-request로 거절한다", async () => {
    const service = createService()

    await expect(
      service.saveStepAnswer({
        answer: { selected: "b" },
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
  })
})

function createService({
  savedAnswers = [],
}: {
  readonly savedAnswers?: SaveStepAnswerCommand[]
} = {}): LearningService {
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
  const learningRepository: LearningRepository = {
    async completeLesson() {},
    async saveLessonProgress() {},
    async saveStepAnswer(command) {
      savedAnswers.push(command)
    },
  }

  return createLearningService({
    contentRepository,
    learningRepository,
  })
}

const lesson: LessonDto = lessonDtoSchema.parse({
  id: "l1",
  courseId: courseIdSchema.parse("c1"),
  unitId: unitIdSchema.parse("u1"),
  title: "좋은 문장이란 무엇인가",
  category: "문장의 기본기",
  description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
  estimatedMinutes: 5,
  summary: ["좋은 문장은 모호하지 않다"],
  steps: [
    {
      id: "l1-s1",
      type: "READING",
      sortOrder: 1,
      title: "명료성의 원칙",
      guide: "좋은 문장의 기준을 읽습니다.",
      body: "좋은 문장은 한 가지 의미를 분명히 전달합니다.",
    },
    {
      id: "l1-s2",
      type: "COMPARE",
      sortOrder: 2,
      title: "두 도입부 비교",
      versions: [
        { label: "평범한 도입", text: "오늘은 글쓰기를 이야기한다." },
        { label: "훅이 있는 도입", text: "나는 3년간 매일 썼다." },
      ],
      analysis: "구체적인 장면은 독자를 끌어당깁니다.",
    },
    {
      id: "l1-s3",
      type: "MULTIPLE_CHOICE",
      sortOrder: 3,
      question: "한 문단에 들어가야 할 주제문의 수는?",
      options: [
        { id: "a", text: "2개 이상" },
        { id: "b", text: "정확히 1개" },
      ],
      correct: "b",
      explanation: "하나의 문단에는 하나의 핵심 주제문이 들어갑니다.",
    },
    {
      id: "l1-s4",
      type: "FILL_BLANK",
      sortOrder: 4,
      template: "그는 회의 내내 동료의 발표를 ___ 했다.",
      words: ["보다", "관찰"],
      answer: ["관찰"],
      explanation: "집중해서 살피는 행위에는 관찰이 정확합니다.",
    },
    {
      id: "l1-s5",
      type: "SELECT",
      sortOrder: 5,
      question: "주어 역할을 하는 구간을 모두 선택하세요.",
      segments: ["꾸준한 ", "글쓰기는 ", "사고를 ", "정돈한다."],
      correct: [0, 1],
      explanation: "꾸준한 글쓰기는 주어부입니다.",
    },
    {
      id: "l1-s6",
      type: "ORDER",
      sortOrder: 6,
      title: "문장을 자연스러운 어순으로",
      items: ["나는", "책을", "읽었다"],
      correct: ["나는", "책을", "읽었다"],
      explanation: "한국어 기본 어순을 확인합니다.",
    },
    {
      id: "l1-s7",
      type: "WRITE",
      sortOrder: 7,
      title: "쓰기 전 5분 계획",
      guide: "글 재료를 모읍니다.",
      min: 20,
      goal: 80,
    },
    {
      id: "l1-s8",
      type: "AI_FEEDBACK",
      sortOrder: 8,
      target: "wr",
      focus: "명확성",
      feedback: "주장과 근거가 명확히 구분되어 있습니다.",
      showScore: true,
      score: 92,
      scoreMax: 100,
      allowRetry: true,
    },
    {
      id: "l1-s9",
      type: "MATCH",
      sortOrder: 9,
      title: "접속사와 기능 짝짓기",
      guide: "왼쪽 접속사와 오른쪽 기능을 짝지으세요.",
      pairs: [{ left: "그러나", right: "역접" }],
      explanation: "접속사는 논리 관계를 보여줍니다.",
    },
    {
      id: "l1-s10",
      type: "CATEGORIZE",
      sortOrder: 10,
      title: "문장 분류하기",
      guide: "각 문장의 역할을 분류하세요.",
      categories: [{ id: "A", label: "주제문" }],
      items: [
        {
          id: "i1",
          text: "꾸준한 글쓰기는 사고를 정돈한다.",
          categoryId: "A",
        },
      ],
      explanation: "단락은 주제문과 뒷받침으로 구성합니다.",
    },
  ],
})
