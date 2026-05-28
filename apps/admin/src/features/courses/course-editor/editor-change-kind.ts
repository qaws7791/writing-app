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
