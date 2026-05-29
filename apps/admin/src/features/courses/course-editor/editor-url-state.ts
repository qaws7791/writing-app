export type CourseEditorView = "lesson" | "step" | "preview"

export type CourseEditorUrlState = {
  versionId: string | null
  view: CourseEditorView
  lessonId: string | null
  stepId: string | null
}

const editorViews = new Set<CourseEditorView>(["lesson", "step", "preview"])

export function parseEditorUrlState(
  searchParams: URLSearchParams
): CourseEditorUrlState {
  const rawView = searchParams.get("view")
  const view =
    rawView && editorViews.has(rawView as CourseEditorView)
      ? (rawView as CourseEditorView)
      : "lesson"

  return {
    versionId: searchParams.get("version"),
    view,
    lessonId: searchParams.get("lessonId"),
    stepId: view === "step" ? searchParams.get("stepId") : null,
  }
}
