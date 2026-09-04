export type AuthoringIssueSeverity = "error" | "warning"

/** 오류는 병합을 막고, 경고는 리뷰어가 판정한다. */
export type LessonAuthoringIssue = Readonly<{
  message: string
  path: string
  severity: AuthoringIssueSeverity
}>
