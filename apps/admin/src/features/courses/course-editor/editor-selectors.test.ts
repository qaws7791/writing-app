import { describe, expect, it } from "vitest"

import { createCourseEditorSelection } from "@/features/courses/course-editor/editor-selectors"
import { createCourseEditorWorkingCopy } from "@/features/courses/course-editor/editor-state"

describe("course editor selectors", () => {
  it("falls back to the first lesson when URL has no lesson id", () => {
    const selection = createCourseEditorSelection({
      workingCopy: createCourseEditorWorkingCopy({
        course,
        revision: 0,
        curriculum,
      }),
      urlState: {
        view: "lesson",
        lessonId: null,
        stepId: null,
      },
    })

    expect(selection.selectedLessonId).toBe("lesson-1")
    expect(selection.selectedChapter?.id).toBe("chapter-1")
    expect(selection.selectedLesson?.title).toBe("첫 레슨")
    expect(selection.selectedLessonSteps.map((step) => step.id)).toEqual([
      "step-1",
      "step-2",
    ])
  })

  it("does not select a step from another lesson", () => {
    const selection = createCourseEditorSelection({
      workingCopy: createCourseEditorWorkingCopy({
        course,
        revision: 0,
        curriculum,
      }),
      urlState: {
        view: "step",
        lessonId: "lesson-1",
        stepId: "step-3",
      },
    })

    expect(selection.selectedLessonId).toBe("lesson-1")
    expect(selection.selectedLessonSteps.map((step) => step.id)).toEqual([
      "step-1",
      "step-2",
    ])
    expect(selection.selectedStep).toBeNull()
  })
})

const course = {
  id: "course-1",
  title: "원본 코스",
  description: "원본 설명",
  sortOrder: 1,
}

const curriculum = {
  chapters: [
    {
      id: "chapter-1",
      title: "첫 챕터",
      sortOrder: 1,
      status: "active" as const,
      lessons: [
        {
          id: "course-lesson-1",
          lessonId: "lesson-1",
          title: "첫 레슨",
          description: "레슨 설명",
          sortOrder: 1,
          status: "active" as const,
        },
      ],
    },
    {
      id: "chapter-2",
      title: "둘째 챕터",
      sortOrder: 2,
      status: "active" as const,
      lessons: [
        {
          id: "course-lesson-2",
          lessonId: "lesson-2",
          title: "둘째 레슨",
          description: "레슨 설명",
          sortOrder: 1,
          status: "active" as const,
        },
      ],
    },
  ],
  steps: [
    {
      id: "step-1",
      lessonId: "lesson-1",
      type: "INTRO" as const,
      title: "도입",
      sortOrder: 1,
      points: 0,
      required: true,
      status: "active" as const,
      content: {
        title: "첫 레슨",
        category: "문장",
        tagTone: "primary" as const,
        bullets: ["문장 구조를 확인합니다."],
        estimatedMinutes: 5,
        totalSteps: 2,
      },
    },
    {
      id: "step-2",
      lessonId: "lesson-1",
      type: "SUMMARY" as const,
      title: "정리",
      sortOrder: 2,
      points: 10,
      required: true,
      status: "active" as const,
      content: {
        points: [
          {
            number: 1,
            text: "목적어를 붙였습니다.",
          },
        ],
      },
    },
    {
      id: "step-3",
      lessonId: "lesson-2",
      type: "INTRO" as const,
      title: "둘째 도입",
      sortOrder: 1,
      points: 0,
      required: true,
      status: "active" as const,
      content: {
        title: "둘째 레슨",
        category: "문장",
        tagTone: "primary" as const,
        bullets: ["다음 문장 구조를 확인합니다."],
        estimatedMinutes: 5,
        totalSteps: 1,
      },
    },
  ],
}
