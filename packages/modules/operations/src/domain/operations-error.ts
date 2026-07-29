import type { Failure } from "@workspace/kernel/failure"

export type OperationsError = Failure<
  "reporting-unavailable",
  {
    readonly query:
      | "ai-feedback-quality"
      | "analytics"
      | "dashboard"
      | "lesson-analytics"
  }
>
