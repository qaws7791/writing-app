import { describe, expect, it } from "vitest"

import {
  adminCourseEditorDocumentSchema,
  adminCourseEditorWriteDocumentSchema,
} from "#contracts/content/admin-courses"

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
    answer: ["word-1"],
    explanation: "해설",
    template: "___",
    type: "FILL_BLANK",
    wordIds: ["word-1"],
    words: ["정답"],
  },
  {
    correct: ["segment-1"],
    explanation: "해설",
    question: "질문",
    segmentIds: ["segment-1"],
    segments: ["문장"],
    type: "SELECT",
  },
  {
    correct: ["item-1"],
    explanation: "해설",
    itemIds: ["item-1"],
    items: ["첫째"],
    title: "순서",
    type: "ORDER",
  },
  { min: 10, prompt: "쓰기", type: "WRITE" },
  {
    allowRetry: true,
    feedback: "피드백",
    focus: "초점",
    target: "step-7",
    type: "AI_FEEDBACK",
  },
  {
    explanation: "해설",
    guide: "안내",
    pairs: [
      {
        left: "왼쪽",
        leftId: "left-1",
        right: "오른쪽",
        rightId: "right-1",
      },
    ],
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
    const document = {
      assets: [],
      category: "미분류",
      coverAssetId: null,
      curriculumVersionId: "course-1-v1",
      description: "설명",
      editVersion: 1,
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
    }

    expect(() => adminCourseEditorDocumentSchema.parse(document)).not.toThrow()
  })

  it("중복 ID를 거부한다", () => {
    const result = adminCourseEditorDocumentSchema.safeParse({
      ...createEditableCourse(),
      units: [
        {
          id: "duplicate",
          lessons: [],
          sortOrder: 1,
          status: "active",
          title: "유닛",
        },
        {
          id: "duplicate",
          lessons: [],
          sortOrder: 2,
          status: "active",
          title: "유닛",
        },
      ],
    })

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "ID는 중복될 수 없습니다.",
    ])
  })

  it("1부터 연속되지 않는 sortOrder를 거부한다", () => {
    const result = adminCourseEditorDocumentSchema.safeParse({
      ...createEditableCourse(),
      units: [
        {
          id: "unit-1",
          lessons: [],
          sortOrder: 2,
          status: "active",
          title: "유닛",
        },
      ],
    })

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "sortOrder는 1부터 연속되어야 합니다.",
    ])
  })

  it("write 문서는 canonical asset metadata를 받지 않고 ID 참조만 받는다", () => {
    const result = adminCourseEditorWriteDocumentSchema.safeParse({
      assets: [
        {
          altText: "클라이언트가 위조한 설명",
          byteSize: 1,
          contentType: "image/webp",
          courseId: "course-1",
          curriculumVersionId: "course-1-v1",
          id: "asset-1",
          kind: "course-cover",
          url: "https://attacker.example/cover.webp",
        },
      ],
      category: "미분류",
      coverAssetId: "asset-1",
      curriculumVersionId: "course-1-v1",
      description: "설명",
      editVersion: 1,
      id: "course-1",
      revision: 1,
      status: "active",
      title: "코스",
      units: [],
    })

    expect(result.error?.issues).toMatchObject([
      { code: "unrecognized_keys", keys: ["assets"] },
    ])
  })

  it("값 집합에 없는 카테고리 저장은 조치를 알리는 한국어 메시지로 거절한다", () => {
    const { assets: _assets, ...writeDocument } = createEditableCourse()

    const result = adminCourseEditorWriteDocumentSchema.safeParse({
      ...writeDocument,
      category: "입문자를 위한 코스",
      units: [],
    })

    expect(result.error?.issues).toMatchObject([
      { message: "카테고리를 목록에서 선택해 주세요.", path: ["category"] },
    ])
  })

  it("값 집합에 없는 카테고리를 가진 기존 코스의 조회는 계속 성공한다", () => {
    const result = adminCourseEditorDocumentSchema.safeParse({
      ...createEditableCourse(),
      category: "입문자를 위한 코스",
      units: [],
    })

    expect(result.success).toBe(true)
  })
})

function createEditableCourse() {
  return {
    assets: [],
    category: "미분류",
    coverAssetId: null,
    curriculumVersionId: "course-1-v1",
    description: "설명",
    editVersion: 1,
    id: "course-1",
    revision: 1,
    status: "active",
    title: "코스",
  }
}
