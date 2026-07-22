import { describe, expect, it } from "vitest"
import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"
import {
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"

import {
  courseEditorReducer,
  createCourseEditorState,
} from "@/features/course-editor/model/course-editor-reducer"

const document = adminCourseEditorSchema.parse({
  category: "미분류",
  curriculumVersionId: "course-1-v1",
  description: "설명",
  editVersion: 0,
  id: "course-1",
  revision: 1,
  status: "active",
  title: "코스",
  units: [],
})

describe("courseEditorReducer", () => {
  it("배열 변경마다 1-based sortOrder를 다시 계산한다", () => {
    const withUnits = courseEditorReducer(
      courseEditorReducer(createCourseEditorState(document), {
        type: "unit-added",
        unitId: unitIdSchema.parse("unit-1"),
      }),
      { type: "unit-added", unitId: unitIdSchema.parse("unit-2") }
    )
    const withLesson = courseEditorReducer(withUnits, {
      lessonId: lessonIdSchema.parse("lesson-1"),
      type: "lesson-added",
      unitId: unitIdSchema.parse("unit-2"),
    })
    const removed = courseEditorReducer(withLesson, {
      type: "unit-removed",
      unitId: unitIdSchema.parse("unit-1"),
    })

    expect(removed.draft.units).toMatchObject([
      { lessons: [{ sortOrder: 1 }], sortOrder: 1 },
    ])
    expect(removed.status).toBe("dirty")
  })

  it("충돌에서 최신본 교체와 로컬 초안 편집 버전 재기준을 구분한다", () => {
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
    const conflict = courseEditorReducer(dirty, {
      latest,
      type: "conflict-detected",
    })

    expect(
      courseEditorReducer(conflict, { type: "latest-selected" }).draft
    ).toEqual(latest)
    expect(
      courseEditorReducer(conflict, { type: "local-rebased" }).draft
    ).toMatchObject({
      curriculumVersionId: "course-1-v2",
      editVersion: 3,
      revision: 2,
      title: "로컬 제목",
    })
  })

  it("AI 코칭 대상 변경을 해당 레슨의 AI_FEEDBACK 스텝에만 반영한다", () => {
    const unitId = unitIdSchema.parse("unit-1")
    const lessonId = lessonIdSchema.parse("lesson-1")
    const writeStepId = lessonStepIdSchema.parse("write-1")
    const nextWriteStepId = lessonStepIdSchema.parse("write-2")
    const aiStepId = lessonStepIdSchema.parse("ai-1")
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
                  id: nextWriteStepId,
                  min: 1,
                  prompt: "다시 쓰기",
                  sortOrder: 2,
                  status: "active",
                  type: "WRITE",
                },
                {
                  allowRetry: true,
                  feedback: "피드백",
                  focus: "명확성",
                  id: aiStepId,
                  score: 1,
                  scoreMax: 5,
                  showScore: true,
                  sortOrder: 3,
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

    const changed = courseEditorReducer(
      createCourseEditorState(editableDocument),
      {
        lessonId,
        stepId: aiStepId,
        targetStepId: nextWriteStepId,
        type: "ai-feedback-target-changed",
        unitId,
      }
    )

    expect(changed.draft.units[0]?.lessons[0]?.steps[2]).toMatchObject({
      id: aiStepId,
      target: nextWriteStepId,
    })
    expect(changed.status).toBe("dirty")
  })
})
