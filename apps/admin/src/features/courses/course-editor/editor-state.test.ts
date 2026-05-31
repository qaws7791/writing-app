import { describe, expect, it } from "vitest"

import {
  getEditorChangeKind,
  summarizeEditorChanges,
} from "@/features/courses/course-editor/editor-change-kind"
import {
  addChapter,
  addLesson,
  addStep,
  archiveChapter,
  archiveLesson,
  archiveStep,
  createCourseEditorSaveInput,
  createCourseEditorWorkingCopy,
  getDirtyState,
  moveItem,
  moveLesson,
  moveStep,
  updateChapterField,
  updateCourseField,
  updateLessonField,
  updateStepContentField,
} from "@/features/courses/course-editor/editor-state"
import {
  getNodeStatusLabel,
  getStepTypeLabel,
} from "@/features/courses/course-editor/editor-labels"
import { parseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import { getStepDefaultPoints } from "@/features/courses/course-editor/step-definitions"

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
        {
          id: "course-lesson-2",
          lessonId: "lesson-2",
          title: "둘째 레슨",
          description: "레슨 설명",
          sortOrder: 2,
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
  ],
}

describe("course editor state", () => {
  it("parses step view from search params without curriculum version state", () => {
    expect(
      parseEditorUrlState(
        new URLSearchParams("view=step&lessonId=lesson-1&stepId=step-1")
      )
    ).toEqual({
      view: "step",
      lessonId: "lesson-1",
      stepId: "step-1",
    })
  })

  it("falls back to lesson view for invalid search params", () => {
    expect(parseEditorUrlState(new URLSearchParams("view=unknown"))).toEqual({
      view: "lesson",
      lessonId: null,
      stepId: null,
    })
  })

  it("classifies lesson reorder as structural", () => {
    expect(
      getEditorChangeKind({
        courseChanged: false,
        addedStepCount: 0,
        reorderedLessonCount: 1,
        archivedLessonCount: 0,
        archivedChapterCount: 0,
      })
    ).toBe("structural")
  })

  it("summarizes editor changes from dirty change records", () => {
    expect(
      summarizeEditorChanges([
        {
          type: "course-field-updated",
          field: "title",
        },
        {
          type: "step-added",
          stepId: "step-1",
        },
        {
          type: "lesson-archived",
          lessonId: "lesson-1",
        },
        {
          type: "lesson-reordered",
          lessonId: "lesson-1",
          targetIndex: 1,
        },
      ])
    ).toEqual({
      courseChanged: true,
      addedStepCount: 1,
      reorderedLessonCount: 1,
      archivedLessonCount: 1,
      archivedChapterCount: 0,
    })
  })

  it("keeps repeated lesson reorder changes distinct by target", () => {
    const baseChapter = curriculum.chapters[0]

    if (!baseChapter) {
      throw new Error("Expected test curriculum to include a chapter.")
    }

    const initial = createCourseEditorWorkingCopy({
      course,
      revision: 0,
      curriculum: {
        ...curriculum,
        chapters: [
          {
            ...baseChapter,
            lessons: [
              ...baseChapter.lessons,
              {
                id: "course-lesson-3",
                lessonId: "lesson-3",
                title: "셋째 레슨",
                description: "레슨 설명",
                sortOrder: 3,
                status: "active" as const,
              },
              {
                id: "course-lesson-4",
                lessonId: "lesson-4",
                title: "넷째 레슨",
                description: "레슨 설명",
                sortOrder: 4,
                status: "active" as const,
              },
            ],
          },
        ],
      },
    })
    const reordered = moveLesson(
      moveLesson(moveLesson(initial, "lesson-1", 1), "lesson-1", 2),
      "lesson-1",
      3
    )

    expect(summarizeEditorChanges(reordered.dirty.changes)).toMatchObject({
      reorderedLessonCount: 3,
    })
    expect(
      getEditorChangeKind(summarizeEditorChanges(reordered.dirty.changes))
    ).toBe("major-revision")
  })

  it("maps internal editor labels to Korean display text", () => {
    expect(getNodeStatusLabel("active")).toBe("활성")
    expect(getNodeStatusLabel("archived")).toBe("보관됨")
    expect(getStepTypeLabel("SHORT_WRITE")).toBe("짧은 글쓰기")
  })

  it("moves an item without mutating the original list", () => {
    const items = ["intro", "practice", "summary"]

    expect(moveItem(items, 0, 2)).toEqual(["practice", "summary", "intro"])
    expect(items).toEqual(["intro", "practice", "summary"])
  })

  it("moves lessons and steps without mutating the original working copy", () => {
    const workingCopy = createCourseEditorWorkingCopy({
      course,
      revision: 0,
      curriculum,
    })
    const movedLesson = moveLesson(workingCopy, "lesson-1", 1)
    const movedStep = moveStep(workingCopy, "lesson-1", "step-1", 1)

    expect(
      movedLesson.curriculum.chapters[0]?.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        sortOrder: lesson.sortOrder,
      }))
    ).toEqual([
      { lessonId: "lesson-2", sortOrder: 1 },
      { lessonId: "lesson-1", sortOrder: 2 },
    ])
    expect(movedStep.steps.map((step) => step.id)).toEqual(["step-2", "step-1"])
    expect(workingCopy.curriculum.chapters[0]?.lessons[0]?.lessonId).toBe(
      "lesson-1"
    )
  })

  it("adds and archives chapters lessons and steps", () => {
    const initial = createCourseEditorWorkingCopy({
      course,
      revision: 0,
      curriculum: {
        chapters: [],
        steps: [],
      },
    })
    const withChapter = addChapter(initial, {
      id: "draft-chapter",
      title: "새 챕터",
    })
    const withLesson = addLesson(withChapter, "draft-chapter", {
      id: "draft-course-lesson",
      lessonId: "draft-lesson",
      title: "새 레슨",
      description: "새 설명",
    })
    const withStep = addStep(withLesson, {
      id: "draft-step",
      lessonId: "draft-lesson",
      type: "INTRO",
      title: "도입",
    })
    const archived = archiveStep(
      archiveLesson(archiveChapter(withStep, "draft-chapter"), "draft-lesson"),
      "draft-step"
    )

    expect(archived.curriculum.chapters[0]).toMatchObject({
      id: "draft-chapter",
      sortOrder: 1,
      status: "archived",
      lessons: [
        {
          lessonId: "draft-lesson",
          sortOrder: 1,
          status: "archived",
        },
      ],
    })
    expect(archived.steps[0]).toMatchObject({
      id: "draft-step",
      points: getStepDefaultPoints("INTRO"),
      required: true,
      sortOrder: 1,
      status: "archived",
    })
    expect(archived.dirty.changedFields).toEqual([
      "chapter.add",
      "lesson.add",
      "step.add",
      "chapter.draft-chapter.status",
      "lesson.draft-lesson.status",
      "step.draft-step.status",
    ])
    expect(archived.dirty.changes).toEqual([
      {
        type: "chapter-added",
        chapterId: "draft-chapter",
      },
      {
        type: "lesson-added",
        lessonId: "draft-lesson",
      },
      {
        type: "step-added",
        stepId: "draft-step",
      },
      {
        type: "chapter-archived",
        chapterId: "draft-chapter",
      },
      {
        type: "lesson-archived",
        lessonId: "draft-lesson",
      },
      {
        type: "step-archived",
        stepId: "draft-step",
      },
    ])
  })

  it("updates fields and builds a direct curriculum save input", () => {
    const workingCopy = updateStepContentField(
      updateLessonField(
        updateChapterField(
          updateCourseField(
            createCourseEditorWorkingCopy({ course, revision: 0, curriculum }),
            "title",
            "수정 코스"
          ),
          "chapter-1",
          "title",
          "수정 챕터"
        ),
        "lesson-1",
        "title",
        "수정 레슨"
      ),
      "step-1",
      "title",
      "수정 도입"
    )

    expect(getDirtyState(workingCopy.dirty.changedFields).hasChanges).toBe(true)
    const saveInput = createCourseEditorSaveInput(workingCopy)

    expect(saveInput).toMatchObject({
      courseId: "course-1",
      expectedRevision: 0,
      course: {
        title: "수정 코스",
      },
      chapters: [
        {
          id: "chapter-1",
          title: "수정 챕터",
        },
      ],
    })
    expect(saveInput.lessons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lessonId: "lesson-1",
          title: "수정 레슨",
          chapterId: "chapter-1",
        }),
      ])
    )
    expect(saveInput.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "step-1",
          content: expect.objectContaining({
            title: "수정 도입",
          }),
        }),
      ])
    )
  })

  it("keeps steps as the only working copy step source", () => {
    const workingCopy = createCourseEditorWorkingCopy({
      course,
      revision: 0,
      curriculum,
    })

    expect("steps" in workingCopy.curriculum).toBe(false)
    expect(workingCopy.steps).not.toBe(curriculum.steps)
    expect(workingCopy.steps[0]?.content).not.toBe(curriculum.steps[0]?.content)
  })
})
