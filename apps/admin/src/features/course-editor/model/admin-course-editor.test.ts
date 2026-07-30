import { describe, expect, it } from "vitest"

import {
  adminCourseEditorSchema,
  type AdminCourseDetail,
} from "@/features/course-editor/model/admin-course-editor"
import { createAdminCourseEditorFixture } from "@/features/course-editor/test/fixtures/admin-course-editor"

describe("adminCourseEditorSchema", () => {
  it("generated DTO 경계에서 명시적인 undefined 속성을 제거한다", () => {
    const document = parseWithSteps([multipleChoiceStep({ wrong: undefined })])

    expect(readSteps(document)[0]).not.toHaveProperty("wrong")
  })

  it("첫 원소뿐 아니라 배열의 모든 스텝에서 undefined 속성을 제거한다", () => {
    const document = parseWithSteps([
      multipleChoiceStep({ wrong: undefined }),
      readingStep({ illustrationAssetId: undefined, source: undefined }),
    ])

    expect(readSteps(document)[1]).not.toHaveProperty("illustrationAssetId")
    expect(readSteps(document)[1]).not.toHaveProperty("source")
  })

  it("값이 있는 optional 속성은 그대로 남긴다", () => {
    const document = parseWithSteps([
      multipleChoiceStep({ wrong: "오답 해설" }),
    ])

    expect(readSteps(document)[0]).toMatchObject({ wrong: "오답 해설" })
  })

  it("null 속성은 undefined와 구분해 최상위와 중첩 객체 모두에서 보존한다", () => {
    const document = parseWithSteps([multipleChoiceStep({ wrong: undefined })])

    expect(document.coverAssetId).toBeNull()
    expect(document.units[0]?.lessons[0]).toMatchObject({
      category: null,
      description: null,
    })
  })
})

function parseWithSteps(steps: readonly Readonly<Record<string, unknown>>[]) {
  return adminCourseEditorSchema.parse({
    ...createAdminCourseEditorFixture(),
    units: [
      {
        id: "unit-1",
        lessons: [
          {
            category: null,
            description: null,
            estimatedMinutes: 10,
            id: "lesson-1",
            sortOrder: 1,
            status: "active",
            steps,
            summary: [],
            title: "강의",
          },
        ],
        sortOrder: 1,
        status: "active",
        title: "단원",
      },
    ],
  })
}

function readSteps(document: AdminCourseDetail) {
  const lesson = document.units[0]?.lessons[0]

  if (lesson === undefined) {
    throw new Error("스텝 fixture가 필요합니다.")
  }

  return lesson.steps
}

function multipleChoiceStep(
  overrides: Readonly<{ wrong: string | undefined }>
): Readonly<Record<string, unknown>> {
  return {
    correct: "option-1",
    explanation: "해설",
    id: "step-1",
    options: [
      { id: "option-1", text: "첫 번째" },
      { id: "option-2", text: "두 번째" },
    ],
    question: "질문",
    sortOrder: 1,
    status: "active",
    type: "MULTIPLE_CHOICE",
    ...overrides,
  }
}

function readingStep(
  overrides: Readonly<{
    illustrationAssetId: string | undefined
    source: string | undefined
  }>
): Readonly<Record<string, unknown>> {
  return {
    body: "본문",
    guide: "안내",
    id: "step-2",
    sortOrder: 2,
    status: "active",
    title: "읽기",
    type: "READING",
    ...overrides,
  }
}
