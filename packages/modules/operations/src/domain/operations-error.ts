import type { Failure } from "@workspace/kernel/failure"

export type OperationsError = Failure<
  "reporting-unavailable",
  {
    readonly query: "analytics" | "dashboard" | "lesson-analytics"
  }
>
