import { describe, expect, it } from "vitest"

import {
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"

import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"
import {
  courseEditorReducer,
  createCourseEditorState,
} from "@/features/course-editor/model/course-editor-reducer"
import { createAdminCourseEditorFixture } from "@/features/course-editor/test/fixtures/admin-course-editor"

const document = adminCourseEditorSchema.parse(
  createAdminCourseEditorFixture({
    curriculumVersionId: "course-1-v1",
    description: "설명",
    editVersion: 0,
    revision: 1,
    title: "코스",
  })
)

describe("courseEditorReducer", () => {
  it("레슨 복제는 AI target을 복제된 WRITE step으로 바꾸고 유효한 문서를 만든다", () => {
    const unitId = unitIdSchema.parse("unit-1")
    const lessonId = lessonIdSchema.parse("lesson-1")
    const writeStepId = lessonStepIdSchema.parse("write-1")
    const editableDocument = adminCourseEditorSchema.parse({
      ...document,
      units: [
        {
          id: unitId,
          lessons: [
            {
              category: null,
              description: null,
              estimatedMinutes: 5,
              id: lessonId,
              sortOrder: 1,
              status: "active",
              steps: [
                {
                  id: writeStepId,
                  min: 1,
                  prompt: "쓰기",
                  sortOrder: 1,
                  status: "active",
                  type: "WRITE",
                },
                {
                  allowRetry: true,
                  feedback: "피드백",
                  focus: "명확성",
                  id: lessonStepIdSchema.parse("ai-1"),
                  sortOrder: 2,
                  status: "active",
                  target: writeStepId,
                  type: "AI_FEEDBACK",
                },
              ],
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

    const duplicated = courseEditorReducer(
      createCourseEditorState(editableDocument),
      {
        lessonId,
        newLessonId: lessonIdSchema.parse("lesson-copy"),
        newStepIds: [
          lessonStepIdSchema.parse("write-copy"),
          lessonStepIdSchema.parse("ai-copy"),
        ],
        type: "lesson-duplicated",
        unitId,
      }
    )
    const copy = duplicated.draft.units[0]?.lessons[1]

    expect(copy?.steps[1]).toMatchObject({
      id: "ai-copy",
      target: "write-copy",
    })
    expect(adminCourseEditorSchema.safeParse(duplicated.draft).success).toBe(
      true
    )
  })

  it("충돌에서 최신본 선택은 server 문서 전체를 적용한다", () => {
    const { conflict, latest } = createConflictState()

    const selected = courseEditorReducer(conflict, {
      type: "latest-selected",
    })

    expect(selected).toMatchObject({
      draft: latest,
      latest: null,
      status: "clean",
    })
  })

  it("충돌에서 로컬 rebase는 로컬 변경과 최신 server version을 함께 보존한다", () => {
    const { conflict } = createConflictState()

    const rebased = courseEditorReducer(conflict, { type: "local-rebased" })

    expect(rebased).toMatchObject({
      draft: {
        curriculumVersionId: "course-1-v2",
        editVersion: 3,
        revision: 2,
        title: "로컬 제목",
      },
      latest: null,
      status: "dirty",
    })
  })
})

function createConflictState() {
  const dirty = courseEditorReducer(createCourseEditorState(document), {
    field: "title",
    type: "course-changed",
    value: "로컬 제목",
  })
  const latest = {
    ...document,
    curriculumVersionId: curriculumVersionIdSchema.parse("course-1-v2"),
    editVersion: 3,
    revision: 2,
    title: "서버 제목",
  }

  return {
    conflict: courseEditorReducer(dirty, {
      latest,
      type: "conflict-detected",
    }),
    latest,
  }
}
