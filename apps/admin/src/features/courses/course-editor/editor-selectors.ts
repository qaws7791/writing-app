import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import type {
  CourseEditorStep,
  CourseEditorWorkingCopy,
} from "@/features/courses/course-editor/editor-state"

type CourseEditorChapter =
  CourseEditorWorkingCopy["curriculum"]["chapters"][number]
type CourseEditorLesson = CourseEditorChapter["lessons"][number]

export type CourseEditorSelection = {
  selectedChapter: CourseEditorChapter | null
  selectedLesson: CourseEditorLesson | null
  selectedLessonId: string | null
  selectedLessonSteps: CourseEditorStep[]
  selectedStep: CourseEditorStep | null
}

type CourseEditorIndex = {
  chapterByLessonId: Map<string, CourseEditorChapter>
  firstLessonId: string | null
  lessonById: Map<string, CourseEditorLesson>
  lessonStepIds: Map<string, string[]>
  stepById: Map<string, CourseEditorStep>
}

export function createCourseEditorSelection(input: {
  urlState: CourseEditorUrlState
  workingCopy: CourseEditorWorkingCopy
}): CourseEditorSelection {
  const index = createCourseEditorIndex(input.workingCopy)
  const selectedLessonId = input.urlState.lessonId ?? index.firstLessonId
  const selectedLesson = selectedLessonId
    ? (index.lessonById.get(selectedLessonId) ?? null)
    : null
  const selectedChapter = selectedLessonId
    ? (index.chapterByLessonId.get(selectedLessonId) ?? null)
    : null
  const selectedLessonSteps = selectedLessonId
    ? (index.lessonStepIds.get(selectedLessonId) ?? [])
        .map((stepId) => index.stepById.get(stepId))
        .filter(isPresent)
    : []
  const selectedStep = input.urlState.stepId
    ? (index.stepById.get(input.urlState.stepId) ?? null)
    : null

  return {
    selectedChapter,
    selectedLesson,
    selectedLessonId,
    selectedLessonSteps,
    selectedStep:
      selectedStep?.lessonId === selectedLessonId ? selectedStep : null,
  }
}

function createCourseEditorIndex(
  workingCopy: CourseEditorWorkingCopy
): CourseEditorIndex {
  const chapterByLessonId = new Map<string, CourseEditorChapter>()
  const lessonById = new Map<string, CourseEditorLesson>()
  const lessonStepIds = new Map<string, string[]>()
  const stepById = new Map<string, CourseEditorStep>()
  let firstLessonId: string | null = null

  for (const chapter of workingCopy.curriculum.chapters) {
    for (const lesson of chapter.lessons) {
      firstLessonId ??= lesson.lessonId
      lessonById.set(lesson.lessonId, lesson)
      chapterByLessonId.set(lesson.lessonId, chapter)
    }
  }

  for (const step of workingCopy.steps) {
    stepById.set(step.id, step)

    const currentStepIds = lessonStepIds.get(step.lessonId) ?? []
    currentStepIds.push(step.id)
    lessonStepIds.set(step.lessonId, currentStepIds)
  }

  return {
    chapterByLessonId,
    firstLessonId,
    lessonById,
    lessonStepIds,
    stepById,
  }
}

function isPresent<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}
