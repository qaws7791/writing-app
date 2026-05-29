import { describe, expect, it } from "vitest"

import { getEditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
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

describe("course editor state", () => {
  it("parses step view from search params", () => {
    expect(
      parseEditorUrlState(
        new URLSearchParams(
          "version=v2&view=step&lessonId=lesson-1&stepId=step-1"
        )
      )
    ).toEqual({
      versionId: "v2",
      view: "step",
      lessonId: "lesson-1",
      stepId: "step-1",
    })
  })

  it("falls back to lesson view for invalid search params", () => {
    expect(parseEditorUrlState(new URLSearchParams("view=unknown"))).toEqual({
      versionId: null,
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

  it("moves a lesson and marks the working copy dirty", () => {
    const workingCopy = moveLesson(
      createCourseEditorWorkingCopy({
        course: {
          id: "course-1",
          title: "원본 코스",
          description: "원본 설명",
          thumbnailPath: "/course.png",
          sortOrder: 1,
        },
        version: {
          id: "course-1-v2",
          courseId: "course-1",
          versionNumber: 2,
          status: "draft",
          title: "v2",
          changelog: "draft",
          publishedAt: null,
          createdAt: "2026-05-28T00:00:00.000Z",
          revision: 3,
          chapters: [
            {
              id: "chapter-1",
              label: "1",
              title: "첫 챕터",
              sortOrder: 1,
              status: "active",
              lessons: [
                {
                  id: "version-lesson-1",
                  lessonId: "lesson-1",
                  title: "첫 레슨",
                  description: "레슨 설명",
                  sortOrder: 1,
                  status: "active",
                },
                {
                  id: "version-lesson-2",
                  lessonId: "lesson-2",
                  title: "둘째 레슨",
                  description: "레슨 설명",
                  sortOrder: 2,
                  status: "active",
                },
              ],
            },
          ],
          steps: [],
        },
      }),
      "lesson-1",
      1
    )

    expect(
      workingCopy.version.chapters[0]?.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        sortOrder: lesson.sortOrder,
      }))
    ).toEqual([
      { lessonId: "lesson-2", sortOrder: 1 },
      { lessonId: "lesson-1", sortOrder: 2 },
    ])
    expect(workingCopy.dirty.changedFields).toContain("lesson.order")
  })

  it("adds and archives chapters lessons and steps", () => {
    const initial = createCourseEditorWorkingCopy({
      course: {
        id: "course-1",
        title: "원본 코스",
        description: "원본 설명",
        thumbnailPath: "/course.png",
        sortOrder: 1,
      },
      version: {
        id: "course-1-v2",
        courseId: "course-1",
        versionNumber: 2,
        status: "draft",
        title: "v2",
        changelog: "draft",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
        revision: 3,
        chapters: [],
        steps: [],
      },
    })
    const withChapter = addChapter(initial, {
      id: "draft-chapter",
      label: "새 단원",
      title: "새 챕터",
    })
    const withLesson = addLesson(withChapter, "draft-chapter", {
      id: "draft-version-lesson",
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

    expect(archived.version.chapters[0]).toMatchObject({
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
  })

  it("updates chapter fields without mutating the original working copy", () => {
    const initial = createCourseEditorWorkingCopy({
      course: {
        id: "course-1",
        title: "원본 코스",
        description: "원본 설명",
        thumbnailPath: "/course.png",
        sortOrder: 1,
      },
      version: {
        id: "course-1-v2",
        courseId: "course-1",
        versionNumber: 2,
        status: "draft",
        title: "v2",
        changelog: "draft",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
        revision: 3,
        chapters: [
          {
            id: "chapter-1",
            label: "1",
            title: "첫 챕터",
            sortOrder: 1,
            status: "active",
            lessons: [],
          },
        ],
        steps: [],
      },
    })

    const edited = updateChapterField(
      initial,
      "chapter-1",
      "title",
      "수정 챕터"
    )

    expect(initial.version.chapters[0]?.title).toBe("첫 챕터")
    expect(edited.version.chapters[0]?.title).toBe("수정 챕터")
    expect(edited.dirty.changedFields).toContain("chapter.chapter-1.title")
  })

  it("moves steps and preserves typed content field values", () => {
    const workingCopy = createCourseEditorWorkingCopy({
      course: {
        id: "course-1",
        title: "원본 코스",
        description: "원본 설명",
        thumbnailPath: "/course.png",
        sortOrder: 1,
      },
      version: {
        id: "course-1-v2",
        courseId: "course-1",
        versionNumber: 2,
        status: "draft",
        title: "v2",
        changelog: "draft",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
        revision: 3,
        chapters: [],
        steps: [
          {
            id: "step-1",
            lessonId: "lesson-1",
            type: "INTRO",
            title: "도입",
            sortOrder: 1,
            points: 0,
            required: true,
            status: "active",
            content: {},
          },
          {
            id: "step-2",
            lessonId: "lesson-1",
            type: "SUMMARY",
            title: "정리",
            sortOrder: 2,
            points: 10,
            required: true,
            status: "active",
            content: {},
          },
        ],
      },
    })

    const edited = updateStepContentField(
      updateStepContentField(
        moveStep(workingCopy, "lesson-1", "step-1", 1),
        "step-1",
        "estimatedMinutes",
        8
      ),
      "step-1",
      "bullets",
      ["첫 기준", "둘째 기준"]
    )

    expect(edited.steps.map((step) => step.id)).toEqual(["step-2", "step-1"])
    expect(edited.steps[1]).toMatchObject({
      sortOrder: 2,
      content: {
        estimatedMinutes: 8,
        bullets: ["첫 기준", "둘째 기준"],
      },
    })
  })

  it("returns dirty state from changed fields", () => {
    expect(getDirtyState(["course.title"])).toEqual({
      hasChanges: true,
      changedFields: ["course.title"],
    })
  })

  it("creates a working copy with step content preserved", () => {
    const workingCopy = createCourseEditorWorkingCopy({
      course: {
        id: "course-1",
        title: "원본 코스",
        description: "원본 설명",
        thumbnailPath: "/course.png",
        sortOrder: 1,
      },
      version: {
        id: "course-1-v2",
        courseId: "course-1",
        versionNumber: 2,
        status: "draft",
        title: "v2",
        changelog: "draft",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
        revision: 3,
        chapters: [
          {
            id: "chapter-1",
            label: "1",
            title: "첫 챕터",
            sortOrder: 1,
            status: "active",
            lessons: [
              {
                id: "version-lesson-1",
                lessonId: "lesson-1",
                title: "첫 레슨",
                description: "레슨 설명",
                sortOrder: 1,
                status: "active",
              },
            ],
          },
        ],
        steps: [
          {
            id: "step-1",
            lessonId: "lesson-1",
            type: "INTRO",
            title: "도입",
            sortOrder: 1,
            points: 0,
            required: true,
            status: "active",
            content: {
              body: "원본 본문",
            },
          },
        ],
      },
    })

    expect(workingCopy.baseRevision).toBe(3)
    expect(workingCopy.steps[0]?.content).toEqual({ body: "원본 본문" })
  })

  it("builds a save input from edited working copy", () => {
    const workingCopy = updateStepContentField(
      updateLessonField(
        updateCourseField(
          createCourseEditorWorkingCopy({
            course: {
              id: "course-1",
              title: "원본 코스",
              description: "원본 설명",
              thumbnailPath: "/course.png",
              sortOrder: 1,
            },
            version: {
              id: "course-1-v2",
              courseId: "course-1",
              versionNumber: 2,
              status: "draft",
              title: "v2",
              changelog: "draft",
              publishedAt: null,
              createdAt: "2026-05-28T00:00:00.000Z",
              revision: 3,
              chapters: [
                {
                  id: "chapter-1",
                  label: "1",
                  title: "첫 챕터",
                  sortOrder: 1,
                  status: "active",
                  lessons: [
                    {
                      id: "version-lesson-1",
                      lessonId: "lesson-1",
                      title: "첫 레슨",
                      description: "레슨 설명",
                      sortOrder: 1,
                      status: "active",
                    },
                  ],
                },
              ],
              steps: [
                {
                  id: "step-1",
                  lessonId: "lesson-1",
                  type: "INTRO",
                  title: "도입",
                  sortOrder: 1,
                  points: 0,
                  required: true,
                  status: "active",
                  content: {
                    body: "원본 본문",
                  },
                },
              ],
            },
          }),
          "title",
          "수정 코스"
        ),
        "lesson-1",
        "title",
        "수정 레슨"
      ),
      "step-1",
      "body",
      "수정 본문"
    )

    expect(workingCopy.dirty.changedFields).toEqual([
      "course.title",
      "lesson.lesson-1.title",
      "step.step-1.content.body",
    ])
    expect(createCourseEditorSaveInput(workingCopy)).toMatchObject({
      courseId: "course-1",
      versionId: "course-1-v2",
      baseRevision: 3,
      course: {
        title: "수정 코스",
      },
      lessons: [
        {
          lessonId: "lesson-1",
          title: "수정 레슨",
        },
      ],
      steps: [
        {
          id: "step-1",
          content: {
            body: "수정 본문",
          },
        },
      ],
    })
  })
})
