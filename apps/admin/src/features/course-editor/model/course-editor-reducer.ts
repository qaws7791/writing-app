import type {
  AdminContentAsset,
  AdminCourseDetail,
} from "@/features/course-editor/model/admin-course-editor"
import type { EditorStep } from "@/features/course-editor/model/editor-step"

type EditorUnit = AdminCourseDetail["units"][number]
type EditorLesson = EditorUnit["lessons"][number]
type ContentAssetId = AdminCourseDetail["assets"][number]["id"]
type UnitId = EditorUnit["id"]
type LessonId = EditorLesson["id"]
type LessonStepId = EditorLesson["steps"][number]["id"]

type CourseEditorStatus =
  | "clean"
  | "conflict"
  | "dirty"
  | "publishing"
  | "saved"
  | "saving"
  | "server-error"
  | "validation-error"

export type LessonFieldChange =
  | {
      readonly field: "category" | "description"
      readonly value: string | null
    }
  | { readonly field: "estimatedMinutes"; readonly value: number }
  | { readonly field: "summary"; readonly value: readonly string[] }
  | { readonly field: "title"; readonly value: string }

export type CourseEditorState = {
  readonly draft: AdminCourseDetail
  readonly latest: AdminCourseDetail | null
  readonly message: string | null
  readonly status: CourseEditorStatus
}

export type CourseEditorAction =
  | {
      readonly asset: AdminContentAsset
      readonly type: "asset-registered"
    }
  | {
      readonly assetId: ContentAssetId | null
      readonly type: "cover-asset-changed"
    }
  | {
      readonly field: "category" | "description" | "title"
      readonly type: "course-changed"
      readonly value: string
    }
  | { readonly type: "unit-added"; readonly unitId: UnitId }
  | { readonly type: "unit-removed"; readonly unitId: UnitId }
  | {
      readonly title: string
      readonly type: "unit-title-changed"
      readonly unitId: UnitId
    }
  | {
      readonly lessonId: LessonId
      readonly type: "lesson-added"
      readonly unitId: UnitId
    }
  | {
      readonly lessonId: LessonId
      readonly type: "lesson-removed"
      readonly unitId: UnitId
    }
  | {
      readonly lessonId: LessonId
      readonly newLessonId: LessonId
      readonly newStepIds: readonly LessonStepId[]
      readonly type: "lesson-duplicated"
      readonly unitId: UnitId
    }
  | {
      readonly lessonId: LessonId
      readonly targetUnitId: UnitId
      readonly type: "lesson-unit-changed"
      readonly unitId: UnitId
    }
  | {
      readonly lessonId: LessonId
      readonly newStepId: LessonStepId
      readonly stepId: LessonStepId
      readonly type: "step-duplicated"
      readonly unitId: UnitId
    }
  | {
      readonly change: LessonFieldChange
      readonly lessonId: LessonId
      readonly type: "lesson-changed"
      readonly unitId: UnitId
    }
  | {
      readonly lessonId: LessonId
      readonly step: EditorStep
      readonly type: "step-added"
      readonly unitId: UnitId
    }
  | {
      readonly lessonId: LessonId
      readonly step: EditorStep
      readonly type: "step-changed"
      readonly unitId: UnitId
    }
  | {
      readonly direction: "down" | "up"
      readonly lessonId: LessonId
      readonly type: "lesson-moved"
      readonly unitId: UnitId
    }
  | {
      readonly direction: "down" | "up"
      readonly lessonId: LessonId
      readonly stepId: LessonStepId
      readonly type: "step-moved"
      readonly unitId: UnitId
    }
  | {
      readonly lessonId: LessonId
      readonly stepId: LessonStepId
      readonly type: "step-removed"
      readonly unitId: UnitId
    }
  | { readonly type: "save-started" }
  | { readonly type: "publish-started" }
  | {
      readonly document: AdminCourseDetail
      readonly type: "save-succeeded"
    }
  | {
      readonly document: AdminCourseDetail
      readonly type: "publish-succeeded"
    }
  | { readonly message: string; readonly type: "validation-failed" }
  | {
      readonly latest: AdminCourseDetail
      readonly type: "conflict-detected"
    }
  | { readonly message: string; readonly type: "server-failed" }
  | { readonly type: "latest-selected" }
  | { readonly type: "local-rebased" }

export function isUnsaved(state: CourseEditorState): boolean {
  switch (state.status) {
    case "conflict":
    case "dirty":
    case "server-error":
    case "validation-error":
      return true
    case "clean":
    case "publishing":
    case "saved":
    case "saving":
      return false
  }
}

export function canSave(state: CourseEditorState): boolean {
  switch (state.status) {
    case "dirty":
    case "server-error":
    case "validation-error":
      return true
    case "clean":
    case "conflict":
    case "publishing":
    case "saved":
    case "saving":
      return false
  }
}

export function createCourseEditorState(
  document: AdminCourseDetail
): CourseEditorState {
  return { draft: document, latest: null, message: null, status: "clean" }
}

export function courseEditorReducer(
  state: CourseEditorState,
  action: CourseEditorAction
): CourseEditorState {
  switch (action.type) {
    case "asset-registered":
      return {
        ...state,
        draft: {
          ...state.draft,
          assets: [
            ...state.draft.assets.filter(
              (asset) => asset.id !== action.asset.id
            ),
            action.asset,
          ],
        },
      }
    case "cover-asset-changed":
      return changed(state, {
        ...state.draft,
        coverAssetId: action.assetId,
      })
    case "course-changed":
      return changed(state, { ...state.draft, [action.field]: action.value })
    case "unit-added":
      return changed(state, {
        ...state.draft,
        units: reorder([
          ...state.draft.units,
          {
            id: action.unitId,
            lessons: [],
            sortOrder: state.draft.units.length + 1,
            status: "active" as const,
            title: "새 유닛",
          },
        ]),
      })
    case "unit-removed":
      return changed(state, {
        ...state.draft,
        units: reorder(
          state.draft.units.filter((unit) => unit.id !== action.unitId)
        ),
      })
    case "unit-title-changed":
      return changed(state, {
        ...state.draft,
        units: state.draft.units.map((unit) =>
          unit.id === action.unitId ? { ...unit, title: action.title } : unit
        ),
      })
    case "lesson-added":
      return changed(state, {
        ...state.draft,
        units: state.draft.units.map((unit) =>
          unit.id === action.unitId
            ? {
                ...unit,
                lessons: reorder([
                  ...unit.lessons,
                  {
                    category: null,
                    description: null,
                    estimatedMinutes: 5,
                    id: action.lessonId,
                    sortOrder: unit.lessons.length + 1,
                    status: "active" as const,
                    steps: [],
                    summary: [],
                    title: "새 레슨",
                  },
                ]),
              }
            : unit
        ),
      })
    case "lesson-removed":
      return changed(state, {
        ...state.draft,
        units: state.draft.units.map((unit) =>
          unit.id === action.unitId
            ? {
                ...unit,
                lessons: reorder(
                  unit.lessons.filter((lesson) => lesson.id !== action.lessonId)
                ),
              }
            : unit
        ),
      })
    case "lesson-changed":
      return changed(state, {
        ...state.draft,
        units: state.draft.units.map((unit) =>
          unit.id === action.unitId
            ? {
                ...unit,
                lessons: unit.lessons.map((lesson) =>
                  lesson.id === action.lessonId
                    ? { ...lesson, [action.change.field]: action.change.value }
                    : lesson
                ),
              }
            : unit
        ),
      })
    case "lesson-duplicated": {
      const unit = state.draft.units.find(
        (candidate) => candidate.id === action.unitId
      )
      const source = unit?.lessons.find(
        (candidate) => candidate.id === action.lessonId
      )
      if (unit === undefined || source === undefined) return state
      if (action.newStepIds.length !== source.steps.length) return state

      return changed(state, {
        ...state.draft,
        units: state.draft.units.map((candidate) =>
          candidate.id === action.unitId
            ? {
                ...candidate,
                lessons: reorder([
                  ...candidate.lessons,
                  duplicateLesson(source, action),
                ]),
              }
            : candidate
        ),
      })
    }
    case "lesson-unit-changed": {
      const source = state.draft.units
        .find((candidate) => candidate.id === action.unitId)
        ?.lessons.find((candidate) => candidate.id === action.lessonId)
      if (source === undefined || action.targetUnitId === action.unitId) {
        return state
      }
      if (
        !state.draft.units.some(
          (candidate) => candidate.id === action.targetUnitId
        )
      ) {
        return state
      }

      return changed(state, {
        ...state.draft,
        units: state.draft.units.map((candidate) => {
          if (candidate.id === action.unitId) {
            return {
              ...candidate,
              lessons: reorder(
                candidate.lessons.filter(
                  (lesson) => lesson.id !== action.lessonId
                )
              ),
            }
          }
          return candidate.id === action.targetUnitId
            ? { ...candidate, lessons: reorder([...candidate.lessons, source]) }
            : candidate
        }),
      })
    }
    case "step-duplicated":
      return updateLessonSteps(state, action, (steps) => {
        const source = steps.find((step) => step.id === action.stepId)

        return source === undefined
          ? steps
          : reorder([...steps, { ...source, id: action.newStepId }])
      })
    case "lesson-moved": {
      const unit = state.draft.units.find(
        (candidate) => candidate.id === action.unitId
      )
      if (unit === undefined) return state
      const lessons = moveByDirection(
        unit.lessons,
        action.direction,
        (lesson) => lesson.id === action.lessonId
      )
      if (lessons === unit.lessons) return state

      return changed(state, {
        ...state.draft,
        units: state.draft.units.map((candidate) =>
          candidate.id === action.unitId
            ? { ...candidate, lessons: [...lessons] }
            : candidate
        ),
      })
    }
    case "step-added":
      return updateLessonSteps(state, action, (steps) =>
        reorder([...steps, action.step])
      )
    case "step-changed":
      return updateLessonSteps(state, action, (steps) =>
        steps.map((step) =>
          step.id === action.step.id
            ? { ...action.step, sortOrder: step.sortOrder }
            : step
        )
      )
    case "step-moved":
      return updateLessonSteps(state, action, (steps) =>
        moveByDirection(
          steps,
          action.direction,
          (step) => step.id === action.stepId
        )
      )
    case "step-removed":
      return updateLessonSteps(state, action, (steps) =>
        reorder(steps.filter((step) => step.id !== action.stepId))
      )
    case "save-started":
      return { ...state, message: null, status: "saving" }
    case "publish-started":
      return { ...state, message: null, status: "publishing" }
    case "save-succeeded":
      return {
        draft: action.document,
        latest: null,
        message: "코스를 저장했습니다.",
        status: "saved",
      }
    case "publish-succeeded":
      return {
        draft: action.document,
        latest: null,
        message: `리비전 ${action.document.revision - 1}을 발행했습니다.`,
        status: "saved",
      }
    case "validation-failed":
      return { ...state, message: action.message, status: "validation-error" }
    case "conflict-detected":
      return {
        ...state,
        latest: action.latest,
        message: "다른 관리자가 먼저 저장했습니다.",
        status: "conflict",
      }
    case "server-failed":
      return { ...state, message: action.message, status: "server-error" }
    case "latest-selected":
      return state.latest === null
        ? state
        : {
            draft: state.latest,
            latest: null,
            message: "최신 서버 문서로 교체했습니다.",
            status: "clean",
          }
    case "local-rebased":
      return state.latest === null
        ? state
        : {
            ...state,
            draft: {
              ...state.draft,
              curriculumVersionId: state.latest.curriculumVersionId,
              editVersion: state.latest.editVersion,
              revision: state.latest.revision,
            },
            latest: null,
            message: "로컬 초안을 유지했습니다. 검토 후 다시 저장해 주세요.",
            status: "dirty",
          }
  }
}

function changed(
  state: CourseEditorState,
  draft: AdminCourseDetail
): CourseEditorState {
  return { ...state, draft, latest: null, message: null, status: "dirty" }
}

function reorder<TItem extends { readonly sortOrder: number }>(
  items: readonly TItem[]
): TItem[] {
  return items.map((item, index) => ({ ...item, sortOrder: index + 1 }))
}

/**
 * 레슨 사본은 스텝 ID를 새로 발급한다.
 */
function duplicateLesson(
  source: EditorLesson,
  action: Readonly<{
    newLessonId: LessonId
    newStepIds: readonly LessonStepId[]
  }>
): EditorLesson {
  return {
    ...source,
    id: action.newLessonId,
    steps: source.steps.map((step, index) => ({
      ...step,
      id: action.newStepIds[index] ?? step.id,
    })),
    title: `${source.title} 사본`,
  }
}

/** 경계를 벗어나는 이동은 같은 배열 참조를 돌려주어 dirty 전이를 만들지 않는다. */
function moveByDirection<TItem extends { readonly sortOrder: number }>(
  items: readonly TItem[],
  direction: "down" | "up",
  matches: (item: TItem) => boolean
): readonly TItem[] {
  const currentIndex = items.findIndex(matches)
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) {
    return items
  }
  const reordered = [...items]
  const [moved] = reordered.splice(currentIndex, 1)
  if (moved === undefined) return items
  reordered.splice(targetIndex, 0, moved)

  return reorder(reordered)
}

function updateLessonSteps(
  state: CourseEditorState,
  action: Readonly<{ lessonId: LessonId; unitId: UnitId }>,
  update: (steps: readonly EditorStep[]) => readonly EditorStep[]
): CourseEditorState {
  let didChange = false
  const units = state.draft.units.map((unit) => {
    if (unit.id !== action.unitId) return unit
    return {
      ...unit,
      lessons: unit.lessons.map((lesson) => {
        if (lesson.id !== action.lessonId) return lesson
        const steps = update(lesson.steps)
        didChange = steps !== lesson.steps
        return didChange ? { ...lesson, steps: [...steps] } : lesson
      }),
    }
  })
  return didChange ? changed(state, { ...state.draft, units }) : state
}
