import { describe, expect, it } from "vitest"

import {
  answerableLessonStepTypes,
  courseDetailDtoSchema,
  courseListDtoSchema,
  lessonDtoSchema,
  lessonStepDefinitions,
  lessonStepDtoSchema,
  lessonStepTypeSchema,
} from "#contracts/content/course"

const lessonSteps = [
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
    wrong: "주제가 두 개라면 문단을 나눕니다.",
  },
  {
    id: "l1-s4",
    type: "FILL_BLANK",
    sortOrder: 4,
    template: "그는 회의 내내 동료의 발표를 ___ 했다.",
    words: ["보다", "관찰"],
    wordIds: ["word-a", "word-b"],
    answer: ["word-b"],
    explanation: "집중해서 살피는 행위에는 관찰이 정확합니다.",
  },
  {
    id: "l1-s5",
    type: "SELECT",
    sortOrder: 5,
    question: "주어 역할을 하는 구간을 모두 선택하세요.",
    segments: ["꾸준한 ", "글쓰기는 ", "사고를 ", "정돈한다."],
    segmentIds: ["segment-a", "segment-b", "segment-c", "segment-d"],
    correct: ["segment-a", "segment-b"],
    explanation: "꾸준한 글쓰기는 주어부입니다.",
  },
  {
    id: "l1-s6",
    type: "ORDER",
    sortOrder: 6,
    title: "문장을 자연스러운 어순으로",
    items: ["나는", "책을", "읽었다"],
    itemIds: ["item-a", "item-b", "item-c"],
    correct: ["item-a", "item-b", "item-c"],
    showNumbers: true,
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
    max: 160,
    structure: "- 독자\n- 목적\n- 핵심 주장",
  },
  {
    id: "l1-s8",
    type: "AI_FEEDBACK",
    sortOrder: 8,
    target: "l1-s7",
    focus: "명확성",
    feedback: "주장과 근거가 명확히 구분되어 있습니다.",
    allowRetry: true,
  },
  {
    id: "l1-s9",
    type: "MATCH",
    sortOrder: 9,
    title: "접속사와 기능 짝짓기",
    guide: "왼쪽 접속사와 오른쪽 기능을 짝지으세요.",
    pairs: [
      {
        left: "그러나",
        leftId: "left-a",
        right: "역접",
        rightId: "right-a",
      },
    ],
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
      { id: "i1", text: "꾸준한 글쓰기는 사고를 정돈한다.", categoryId: "A" },
    ],
    explanation: "단락은 주제문과 뒷받침으로 구성합니다.",
  },
] as const

describe("콘텐츠 DTO schema", () => {
  it.each(lessonSteps)("$type 유효 계약을 parse한다", (step) => {
    expect(lessonStepDtoSchema.parse(step)).toEqual(step)
  })

  it.each(lessonSteps)(
    "$type 계약은 다른 type discriminator를 거부한다",
    (step) => {
      expect(
        lessonStepDefinitions[step.type].schema.safeParse({
          ...step,
          type: "UNKNOWN",
        }).success
      ).toBe(false)
    }
  )

  it("쓰기 스텝은 guide 없이 prompt나 topic만 있어도 parse한다", () => {
    expect(
      lessonStepDtoSchema.parse({
        id: "l1-s11",
        type: "WRITE",
        sortOrder: 11,
        prompt: "오늘 배운 내용을 한 문장으로 적어보세요.",
        min: 30,
      })
    ).toMatchObject({
      id: "l1-s11",
      type: "WRITE",
    })
  })

  it("기존 score 필드가 남은 AI 코칭 스텝을 거부한다", () => {
    const feedbackStep = lessonSteps.find((step) => step.type === "AI_FEEDBACK")
    if (feedbackStep === undefined) {
      throw new Error("AI 코칭 테스트 fixture가 없습니다.")
    }

    expect(
      lessonStepDtoSchema.safeParse({ ...feedbackStep, score: 92 }).success
    ).toBe(false)
  })

  it("스텝 타입별 DTO와 transition·draft·평가 정책을 같은 계약에서 관리한다", () => {
    expect(Object.keys(lessonStepDefinitions).sort()).toEqual(
      [...lessonStepTypeSchema.options].sort()
    )

    expect(
      lessonStepTypeSchema.options.filter(
        (stepType) => lessonStepDefinitions[stepType].answerable
      )
    ).toEqual([...answerableLessonStepTypes])
    expect(lessonStepDefinitions.READING).toMatchObject({
      completion: "acknowledge",
      draftable: false,
      evaluatedByServer: false,
    })
    expect(lessonStepDefinitions.AI_FEEDBACK).toMatchObject({
      completion: "ai-feedback",
      draftable: false,
      evaluatedByServer: true,
    })
  })

  it("코스 목록과 코스 상세 DTO를 parse한다", () => {
    const summary = {
      id: "c1",
      title: "글쓰기 첫걸음 30일",
      description: "매일 조금씩 쓰는 습관을 만듭니다.",
      category: "입문자를 위한 코스",
      lessonCount: 10,
      status: "active",
      visualKey: "basic-sentence-writing",
    }

    expect(courseListDtoSchema.parse({ courses: [summary] })).toEqual({
      courses: [summary],
    })

    expect(
      courseDetailDtoSchema.parse({
        ...summary,
        progress: {
          completedLessons: 0,
          lessons: [
            {
              currentStepIndex: null,
              lessonId: "l1",
              status: "available",
            },
          ],
          nextLesson: {
            currentStepIndex: null,
            estimatedMinutes: 5,
            id: "l1",
            status: "available",
            title: "좋은 문장이란 무엇인가",
          },
          totalLessons: 10,
          percentage: 0,
        },
        units: [
          {
            id: "u1",
            title: "문장의 기본기",
            sortOrder: 1,
            lessons: [
              {
                id: "l1",
                title: "좋은 문장이란 무엇인가",
                category: "문장의 기본기",
                description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
                estimatedMinutes: 5,
                status: "active",
                sortOrder: 1,
              },
            ],
          },
        ],
      })
    ).toMatchObject({
      id: "c1",
      progress: {
        lessons: [{ lessonId: "l1", status: "available" }],
        nextLesson: { id: "l1", status: "available" },
      },
      units: [{ id: "u1", lessons: [{ id: "l1" }] }],
    })
  })

  it("모든 레슨을 완료한 코스 상세 DTO의 다음 레슨 null을 parse한다", () => {
    expect(
      courseDetailDtoSchema.parse({
        id: "c1",
        title: "글쓰기 첫걸음 30일",
        description: "매일 조금씩 쓰는 습관을 만듭니다.",
        category: "입문자를 위한 코스",
        lessonCount: 1,
        status: "active",
        visualKey: "basic-sentence-writing",
        progress: {
          completedLessons: 1,
          lessons: [
            {
              currentStepIndex: 0,
              lessonId: "l1",
              status: "completed",
            },
          ],
          nextLesson: null,
          percentage: 100,
          totalLessons: 1,
        },
        units: [
          {
            id: "u1",
            title: "문장의 기본기",
            sortOrder: 1,
            lessons: [
              {
                id: "l1",
                title: "좋은 문장이란 무엇인가",
                category: "문장의 기본기",
                description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
                estimatedMinutes: 5,
                status: "active",
                sortOrder: 1,
              },
            ],
          },
        ],
      })
    ).toMatchObject({
      progress: {
        completedLessons: 1,
        nextLesson: null,
        percentage: 100,
      },
    })
  })

  it("레슨 DTO를 parse한다", () => {
    const lesson = lessonDtoSchema.parse({
      id: "l1",
      courseId: "c1",
      unitId: "u1",
      title: "좋은 문장이란 무엇인가",
      category: "문장의 기본기",
      description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
      estimatedMinutes: 5,
      summary: ["좋은 문장은 모호하지 않다"],
      steps: lessonSteps,
    })

    expect(lesson).toMatchObject({
      id: "l1",
      steps: expect.any(Array),
    })
    expect(lesson.steps.slice(0, 2)).toMatchObject([
      { type: "READING" },
      { type: "COMPARE" },
    ])
  })
})
