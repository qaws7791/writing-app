import type { Failure } from "@workspace/kernel/failure"

export type OperationsError =
  | Failure<"invalid-reporting-query", { readonly query: "lesson-analytics" }>
  | Failure<
      "reporting-unavailable",
      {
        readonly query: "analytics" | "dashboard" | "lesson-analytics"
      }
    >
