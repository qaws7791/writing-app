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
      readonly title: string
      readonly type: "lesson-title-changed"
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
    case "lesson-title-changed":
      return changed(state, {
        ...state.draft,
        units: state.draft.units.map((unit) =>
          unit.id === action.unitId
            ? {
                ...unit,
                lessons: unit.lessons.map((lesson) =>
                  lesson.id === action.lessonId
                    ? { ...lesson, title: action.title }
                    : lesson
                ),
              }
            : unit
        ),
      })
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
      return updateLessonSteps(state, action, (steps) => {
        const currentIndex = steps.findIndex(
          (step) => step.id === action.stepId
        )
        const targetIndex =
          action.direction === "up" ? currentIndex - 1 : currentIndex + 1
        if (
          currentIndex < 0 ||
          targetIndex < 0 ||
          targetIndex >= steps.length
        ) {
          return steps
        }
        const reordered = [...steps]
        const [step] = reordered.splice(currentIndex, 1)
        if (step === undefined) return steps
        reordered.splice(targetIndex, 0, step)
        return reorder(reordered)
      })
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
