import { describe, expect, it } from "vitest"

import {
  adminCourseEditorSchema,
  type AdminCourseDetail,
} from "@/features/course-editor/model/admin-course-editor"
import { createAdminCourseEditorFixture } from "@/features/course-editor/test/fixtures/admin-course-editor"

describe("adminCourseEditorSchema", () => {
  it("중첩 DTO에서 undefined를 제거하고 값과 null을 보존한다", () => {
    const document = parseWithSteps([
      multipleChoiceStep({ wrong: undefined }),
      readingStep({ illustrationAssetId: undefined, source: undefined }),
      multipleChoiceStep({ id: "step-3", sortOrder: 3, wrong: "오답 해설" }),
    ])
    const steps = readSteps(document)

    expect(steps[0]).not.toHaveProperty("wrong")
    expect(steps[1]).not.toHaveProperty("illustrationAssetId")
    expect(steps[1]).not.toHaveProperty("source")
    expect(steps[2]).toMatchObject({ wrong: "오답 해설" })
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
  overrides: Readonly<{
    id?: string
    sortOrder?: number
    wrong: string | undefined
  }>
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
