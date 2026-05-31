export type EditorChangeKind =
  | "minor-edit"
  | "additive"
  | "structural"
  | "major-revision"

export type EditorChangeSummary = {
  courseChanged: boolean
  addedStepCount: number
  reorderedLessonCount: number
  archivedLessonCount: number
  archivedChapterCount: number
}

export type EditorChange =
  | {
      type: "course-field-updated"
      field: "description" | "title"
    }
  | {
      type: "chapter-added"
      chapterId: string
    }
  | {
      type: "chapter-archived"
      chapterId: string
    }
  | {
      type: "chapter-field-updated"
      chapterId: string
      field: "title"
    }
  | {
      type: "lesson-added"
      lessonId: string
    }
  | {
      type: "lesson-archived"
      lessonId: string
    }
  | {
      type: "lesson-field-updated"
      lessonId: string
      field: "description" | "title"
    }
  | {
      type: "lesson-reordered"
      lessonId: string
      targetIndex: number
    }
  | {
      type: "step-added"
      stepId: string
    }
  | {
      type: "step-archived"
      stepId: string
    }
  | {
      type: "step-content-updated"
      field: string
      stepId: string
    }
  | {
      type: "step-reordered"
      stepId: string
      targetIndex: number
    }

export function summarizeEditorChanges(
  changes: readonly EditorChange[]
): EditorChangeSummary {
  return {
    courseChanged: changes.some(
      (change) => change.type === "course-field-updated"
    ),
    addedStepCount: changes.filter((change) => change.type === "step-added")
      .length,
    reorderedLessonCount: changes.filter(
      (change) => change.type === "lesson-reordered"
    ).length,
    archivedLessonCount: changes.filter(
      (change) => change.type === "lesson-archived"
    ).length,
    archivedChapterCount: changes.filter(
      (change) => change.type === "chapter-archived"
    ).length,
  }
}

export function getEditorChangeKind(
  summary: EditorChangeSummary
): EditorChangeKind {
  if (summary.archivedLessonCount >= 3 || summary.reorderedLessonCount >= 3) {
    return "major-revision"
  }

  if (
    summary.reorderedLessonCount > 0 ||
    summary.archivedLessonCount > 0 ||
    summary.archivedChapterCount > 0
  ) {
    return "structural"
  }

  if (summary.addedStepCount > 0) {
    return "additive"
  }

  return "minor-edit"
}
