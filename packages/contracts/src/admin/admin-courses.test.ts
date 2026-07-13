import { describe, expect, it } from "vitest"

import { adminCourseEditorDocumentSchema } from "@workspace/contracts/admin/admin-courses"

const stepContents = [
  { body: "본문", guide: "안내", title: "읽기", type: "READING" },
  {
    analysis: "분석",
    title: "비교",
    type: "COMPARE",
    versions: [
      { label: "A", text: "첫째" },
      { label: "B", text: "둘째" },
    ],
  },
  {
    correct: "a",
    explanation: "해설",
    options: [
      { id: "a", text: "정답" },
      { id: "b", text: "오답" },
    ],
    question: "질문",
    type: "MULTIPLE_CHOICE",
  },
  {
    answer: ["정답"],
    explanation: "해설",
    template: "___",
    type: "FILL_BLANK",
    words: ["정답"],
  },
  {
    correct: [0],
    explanation: "해설",
    question: "질문",
    segments: ["문장"],
    type: "SELECT",
  },
  {
    correct: ["첫째"],
    explanation: "해설",
    items: ["첫째"],
    title: "순서",
    type: "ORDER",
  },
  { min: 10, prompt: "쓰기", type: "WRITE" },
  {
    allowRetry: true,
    feedback: "피드백",
    focus: "초점",
    score: 1,
    scoreMax: 5,
    showScore: true,
    target: "대상",
    type: "AI_FEEDBACK",
  },
  {
    explanation: "해설",
    guide: "안내",
    pairs: [{ left: "왼쪽", right: "오른쪽" }],
    title: "짝",
    type: "MATCH",
  },
  {
    categories: [{ id: "c1", label: "분류" }],
    explanation: "해설",
    guide: "안내",
    items: [{ categoryId: "c1", id: "i1", text: "항목" }],
    title: "분류",
    type: "CATEGORIZE",
  },
] as const

describe("admin course editor contract", () => {
  it("10종 step discriminated union을 전체 문서에서 검증한다", () => {
    const result = adminCourseEditorDocumentSchema.safeParse({
      category: "미분류",
      description: "설명",
      id: "course-1",
      revision: 1,
      status: "active",
      title: "코스",
      units: [
        {
          id: "unit-1",
          lessons: [
            {
              category: null,
              description: null,
              estimatedMinutes: 5,
              id: "lesson-1",
              sortOrder: 1,
              status: "active",
              steps: stepContents.map((step, index) => ({
                ...step,
                id: `step-${index + 1}`,
                sortOrder: index + 1,
                status: "active",
              })),
              summary: [],
              title: "레슨",
            },
          ],
          sortOrder: 1,
          status: "active",
          title: "유닛",
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it("중복 ID와 비연속 sortOrder를 거부한다", () => {
    const result = adminCourseEditorDocumentSchema.safeParse({
      category: "",
      description: "",
      id: "course-1",
      revision: 0,
      status: "active",
      title: "코스",
      units: [
        {
          id: "duplicate",
          lessons: [],
          sortOrder: 2,
          status: "active",
          title: "유닛",
        },
        {
          id: "duplicate",
          lessons: [],
          sortOrder: 1,
          status: "active",
          title: "유닛",
        },
      ],
    })

    expect(result.success).toBe(false)
  })
})
