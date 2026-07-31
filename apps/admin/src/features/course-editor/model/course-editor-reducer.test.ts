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

  it("레슨 이동은 sortOrder를 다시 계산하고 경계를 넘는 이동은 무시한다", () => {
    const unitId = unitIdSchema.parse("unit-1")
    const firstLessonId = lessonIdSchema.parse("lesson-1")
    const withLessons = [
      firstLessonId,
      lessonIdSchema.parse("lesson-2"),
    ].reduce(
      (state, lessonId) =>
        courseEditorReducer(state, { lessonId, type: "lesson-added", unitId }),
      courseEditorReducer(createCourseEditorState(document), {
        type: "unit-added",
        unitId,
      })
    )

    const moved = courseEditorReducer(withLessons, {
      direction: "down",
      lessonId: firstLessonId,
      type: "lesson-moved",
      unitId,
    })

    expect(moved.draft.units[0]?.lessons).toMatchObject([
      { id: "lesson-2", sortOrder: 1 },
      { id: "lesson-1", sortOrder: 2 },
    ])
    expect(
      courseEditorReducer(moved, {
        direction: "up",
        lessonId: lessonIdSchema.parse("lesson-2"),
        type: "lesson-moved",
        unitId,
      })
    ).toBe(moved)
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

    const aiStep = editableDocument.units[0]?.lessons[0]?.steps[2]
    if (aiStep?.type !== "AI_FEEDBACK") {
      throw new Error("AI_FEEDBACK fixture가 필요합니다.")
    }
    const changed = courseEditorReducer(
      createCourseEditorState(editableDocument),
      {
        lessonId,
        step: { ...aiStep, target: nextWriteStepId },
        type: "step-changed",
        unitId,
      }
    )

    expect(changed.draft.units[0]?.lessons[0]?.steps[2]).toMatchObject({
      id: aiStepId,
      target: nextWriteStepId,
    })
    expect(changed.status).toBe("dirty")
  })

  it("레슨 사본의 AI 코칭 대상을 사본 안의 쓰기 스텝으로 다시 매핑한다", () => {
    const unitId = unitIdSchema.parse("unit-1")
    const lessonId = lessonIdSchema.parse("lesson-1")
    const writeStepId = lessonStepIdSchema.parse("write-1")
    const newStepIds = [
      lessonStepIdSchema.parse("write-copy"),
      lessonStepIdSchema.parse("ai-copy"),
    ]
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
        newStepIds,
        type: "lesson-duplicated",
        unitId,
      }
    )
    const copy = duplicated.draft.units[0]?.lessons[1]

    expect(copy).toMatchObject({
      id: "lesson-copy",
      sortOrder: 2,
      title: "레슨 사본",
    })
    expect(copy?.steps[1]).toMatchObject({
      id: "ai-copy",
      target: "write-copy",
    })
    expect(adminCourseEditorSchema.safeParse(duplicated.draft).success).toBe(
      true
    )
  })

  it("레슨을 다른 유닛으로 옮기면 양쪽 유닛의 sortOrder를 다시 계산한다", () => {
    const firstUnitId = unitIdSchema.parse("unit-1")
    const secondUnitId = unitIdSchema.parse("unit-2")
    const movedLessonId = lessonIdSchema.parse("lesson-2")
    const withLessons = [
      { lessonId: lessonIdSchema.parse("lesson-1"), unitId: firstUnitId },
      { lessonId: movedLessonId, unitId: firstUnitId },
    ].reduce(
      (state, action) =>
        courseEditorReducer(state, { ...action, type: "lesson-added" }),
      [firstUnitId, secondUnitId].reduce(
        (state, unitId) =>
          courseEditorReducer(state, { type: "unit-added", unitId }),
        createCourseEditorState(document)
      )
    )

    const moved = courseEditorReducer(withLessons, {
      lessonId: movedLessonId,
      targetUnitId: secondUnitId,
      type: "lesson-unit-changed",
      unitId: firstUnitId,
    })

    expect(moved.draft.units[0]?.lessons).toMatchObject([
      { id: "lesson-1", sortOrder: 1 },
    ])
    expect(moved.draft.units[1]?.lessons).toMatchObject([
      { id: "lesson-2", sortOrder: 1 },
    ])
    expect(
      courseEditorReducer(moved, {
        lessonId: movedLessonId,
        targetUnitId: secondUnitId,
        type: "lesson-unit-changed",
        unitId: secondUnitId,
      })
    ).toBe(moved)
  })
})
