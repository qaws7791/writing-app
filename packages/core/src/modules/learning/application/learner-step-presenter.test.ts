import { describe, expect, it } from "vitest"

import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import { learnerLessonStepSchema } from "@workspace/contracts/learning/read-data"

import { presentLearnerStep } from "#core/modules/learning/application/learner-step-presenter"

const futureSecret = "__future_server_only_secret__"
const context = {
  learnerScope: "learner-scope",
  lessonId: "lesson-1",
  versionId: "curriculum:course-1:1",
} as const

const presentationCases = [
  {
    expected: {
      body: "공개 본문",
      guide: "공개 안내",
      id: "reading-1",
      sortOrder: 1,
      source: "공개 출처",
      title: "읽기",
      type: "READING",
    },
    forbiddenKeys: ["futureSecret"],
    name: "READING",
    step: withFutureSecret({
      body: "공개 본문",
      guide: "공개 안내",
      id: "reading-1",
      sortOrder: 1,
      source: "공개 출처",
      title: "읽기",
      type: "READING",
    }),
  },
  {
    expected: {
      id: "compare-1",
      sortOrder: 2,
      title: "비교",
      type: "COMPARE",
      versions: [
        { label: "전", text: "수정 전" },
        { label: "후", text: "수정 후" },
      ],
    },
    forbiddenKeys: ["analysis", "futureSecret"],
    name: "COMPARE",
    step: withFutureSecret({
      analysis: "서버 전용 분석",
      id: "compare-1",
      sortOrder: 2,
      title: "비교",
      type: "COMPARE",
      versions: [
        { label: "전", text: "수정 전" },
        { label: "후", text: "수정 후" },
      ],
    }),
  },
  {
    expected: {
      id: "choice-1",
      options: [
        { id: "option-c", text: "셋째" },
        { id: "option-a", text: "첫째" },
        { id: "option-b", text: "둘째" },
      ],
      question: "정답은?",
      sortOrder: 3,
      type: "MULTIPLE_CHOICE",
    },
    forbiddenKeys: ["correct", "explanation", "futureSecret", "wrong"],
    name: "MULTIPLE_CHOICE",
    step: withFutureSecret({
      correct: "option-b",
      explanation: "서버 전용 정답 해설",
      id: "choice-1",
      options: [
        { id: "option-a", text: "첫째" },
        { id: "option-b", text: "둘째" },
        { id: "option-c", text: "셋째" },
      ],
      question: "정답은?",
      sortOrder: 3,
      type: "MULTIPLE_CHOICE",
      wrong: "서버 전용 오답 해설",
    }),
  },
  {
    expected: {
      blankCount: 2,
      choices: [
        { id: "word-a", text: "나는" },
        { id: "word-b", text: "글을" },
        { id: "word-c", text: "쓴다" },
      ],
      id: "blank-1",
      sortOrder: 4,
      template: "___ ___",
      type: "FILL_BLANK",
    },
    forbiddenKeys: [
      "answer",
      "explanation",
      "futureSecret",
      "wordIds",
      "words",
    ],
    name: "FILL_BLANK",
    step: withFutureSecret({
      answer: ["나는", "쓴다"],
      explanation: "서버 전용 빈칸 해설",
      id: "blank-1",
      sortOrder: 4,
      template: "___ ___",
      type: "FILL_BLANK",
      wordIds: ["word-a", "word-b", "word-c"],
      words: ["나는", "글을", "쓴다"],
    }),
  },
  {
    expected: {
      id: "select-1",
      items: [
        { id: "segment-a", text: "주어" },
        { id: "segment-b", text: "목적어" },
        { id: "segment-c", text: "서술어" },
      ],
      layout: "inline",
      question: "주어를 고르세요.",
      sortOrder: 5,
      type: "SELECT",
    },
    forbiddenKeys: [
      "correct",
      "explanation",
      "futureSecret",
      "segmentIds",
      "segments",
    ],
    name: "SELECT",
    step: withFutureSecret({
      correct: [0],
      explanation: "서버 전용 선택 해설",
      id: "select-1",
      layout: "inline",
      question: "주어를 고르세요.",
      segmentIds: ["segment-a", "segment-b", "segment-c"],
      segments: ["주어", "목적어", "서술어"],
      sortOrder: 5,
      type: "SELECT",
    }),
  },
  {
    expected: {
      id: "order-1",
      items: [
        { id: "item-c", text: "쓴다" },
        { id: "item-a", text: "나는" },
        { id: "item-b", text: "글을" },
      ],
      showNumbers: true,
      sortOrder: 6,
      title: "순서",
      type: "ORDER",
    },
    forbiddenKeys: ["correct", "explanation", "futureSecret", "itemIds"],
    name: "ORDER",
    step: withFutureSecret({
      correct: ["나는", "글을", "쓴다"],
      explanation: "서버 전용 순서 해설",
      id: "order-1",
      itemIds: ["item-a", "item-b", "item-c"],
      items: ["나는", "글을", "쓴다"],
      showNumbers: true,
      sortOrder: 6,
      title: "순서",
      type: "ORDER",
    }),
  },
  {
    expected: {
      badge: "연습",
      claim: "핵심 주장",
      context: "배경",
      draft: true,
      goal: 80,
      guide: "작성 안내",
      id: "write-1",
      max: 200,
      min: 20,
      mode: "essay",
      placeholder: "여기에 쓰세요.",
      prompt: "작성 질문",
      reference: "참고 자료",
      sample: "공개 예시",
      sortOrder: 7,
      structure: "도입-본론-결론",
      title: "쓰기",
      topic: "글쓰기",
      type: "WRITE",
    },
    forbiddenKeys: ["futureSecret"],
    name: "WRITE",
    step: withFutureSecret({
      badge: "연습",
      claim: "핵심 주장",
      context: "배경",
      draft: true,
      goal: 80,
      guide: "작성 안내",
      id: "write-1",
      max: 200,
      min: 20,
      mode: "essay",
      placeholder: "여기에 쓰세요.",
      prompt: "작성 질문",
      reference: "참고 자료",
      sample: "공개 예시",
      sortOrder: 7,
      structure: "도입-본론-결론",
      title: "쓰기",
      topic: "글쓰기",
      type: "WRITE",
    }),
  },
  {
    expected: {
      focus: "명확성",
      id: "feedback-1",
      sortOrder: 8,
      target: "write-1",
      type: "AI_FEEDBACK",
    },
    forbiddenKeys: [
      "allowRetry",
      "feedback",
      "futureSecret",
      "score",
      "scoreMax",
      "showScore",
    ],
    name: "AI_FEEDBACK",
    step: withFutureSecret({
      allowRetry: true,
      feedback: "서버 전용 피드백",
      focus: "명확성",
      id: "feedback-1",
      score: 92,
      scoreMax: 100,
      showScore: true,
      sortOrder: 8,
      target: "write-1",
      type: "AI_FEEDBACK",
    }),
  },
  {
    expected: {
      guide: "연결하세요.",
      id: "match-1",
      leftItems: [
        { id: "left-c", text: "또한" },
        { id: "left-a", text: "그러나" },
        { id: "left-b", text: "따라서" },
      ],
      rightItems: [
        { id: "right-b", text: "인과" },
        { id: "right-a", text: "역접" },
        { id: "right-c", text: "추가" },
      ],
      sortOrder: 9,
      title: "짝짓기",
      type: "MATCH",
    },
    forbiddenKeys: [
      "explanation",
      "futureSecret",
      "left",
      "leftId",
      "pairs",
      "right",
      "rightId",
    ],
    name: "MATCH",
    step: withFutureSecret({
      explanation: "서버 전용 매칭 해설",
      guide: "연결하세요.",
      id: "match-1",
      pairs: [
        {
          left: "그러나",
          leftId: "left-a",
          right: "역접",
          rightId: "right-a",
        },
        {
          left: "따라서",
          leftId: "left-b",
          right: "인과",
          rightId: "right-b",
        },
        {
          left: "또한",
          leftId: "left-c",
          right: "추가",
          rightId: "right-c",
        },
      ],
      sortOrder: 9,
      title: "짝짓기",
      type: "MATCH",
    }),
  },
  {
    expected: {
      categories: [
        { id: "category-a", text: "주장" },
        { id: "category-c", text: "예시" },
        { id: "category-b", text: "근거" },
      ],
      guide: "분류하세요.",
      id: "categorize-1",
      items: [
        { id: "cat-item-a", text: "첫 문장" },
        { id: "cat-item-c", text: "셋째 문장" },
        { id: "cat-item-b", text: "둘째 문장" },
      ],
      sortOrder: 10,
      title: "분류",
      type: "CATEGORIZE",
    },
    forbiddenKeys: ["categoryId", "explanation", "futureSecret", "label"],
    name: "CATEGORIZE",
    step: withFutureSecret({
      categories: [
        { id: "category-a", label: "주장" },
        { id: "category-b", label: "근거" },
        { id: "category-c", label: "예시" },
      ],
      explanation: "서버 전용 분류 해설",
      guide: "분류하세요.",
      id: "categorize-1",
      items: [
        { categoryId: "category-a", id: "cat-item-a", text: "첫 문장" },
        { categoryId: "category-b", id: "cat-item-b", text: "둘째 문장" },
        { categoryId: "category-c", id: "cat-item-c", text: "셋째 문장" },
      ],
      sortOrder: 10,
      title: "분류",
      type: "CATEGORIZE",
    }),
  },
] as const

describe("학습자 단계 보안 presenter", () => {
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
  ] as const)("$type stable item ID가 없으면 거부한다", ({ step }) => {
    expect(() =>
      presentLearnerStep(lessonStepDtoSchema.parse(step), context)
    ).toThrow("Missing stable")
  })
})

function withFutureSecret(input: unknown) {
  return Object.assign({}, lessonStepDtoSchema.parse(input), { futureSecret })
}

function collectObjectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap(collectObjectKeys)
  if (typeof value !== "object" || value === null) return []

  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectObjectKeys(child),
  ])
}
