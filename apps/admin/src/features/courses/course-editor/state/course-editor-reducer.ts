import type { AdminCourseDetail } from "@/features/courses/admin-courses-api"
import type {
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/contracts/content"

export type CourseEditorStatus =
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
      readonly lessonId: LessonId
      readonly stepId: LessonStepId
      readonly targetStepId: LessonStepId
      readonly type: "ai-feedback-target-changed"
      readonly unitId: UnitId
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
    case "ai-feedback-target-changed":
      return changed(state, {
        ...state.draft,
        units: state.draft.units.map((unit) =>
          unit.id === action.unitId
            ? {
                ...unit,
                lessons: unit.lessons.map((lesson) =>
                  lesson.id === action.lessonId
                    ? {
                        ...lesson,
                        steps: lesson.steps.map((step) =>
                          step.id === action.stepId &&
                          step.type === "AI_FEEDBACK"
                            ? { ...step, target: action.targetStepId }
                            : step
                        ),
                      }
                    : lesson
                ),
              }
            : unit
        ),
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
