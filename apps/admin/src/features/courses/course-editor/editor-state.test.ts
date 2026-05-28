import { describe, expect, it } from "vitest"

import { getEditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import {
  createCourseEditorSaveInput,
  createCourseEditorWorkingCopy,
  getDirtyState,
  moveItem,
  updateCourseField,
  updateLessonField,
  updateStepContentField,
} from "@/features/courses/course-editor/editor-state"
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

  it("moves an item without mutating the original list", () => {
    const items = ["intro", "practice", "summary"]

    expect(moveItem(items, 0, 2)).toEqual(["practice", "summary", "intro"])
    expect(items).toEqual(["intro", "practice", "summary"])
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
