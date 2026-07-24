export type OperationsError = Readonly<{
  kind: "reporting-unavailable"
  query: "ai-feedback-quality" | "analytics" | "dashboard" | "lesson-analytics"
}>
