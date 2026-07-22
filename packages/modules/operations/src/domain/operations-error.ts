export type OperationsError =
  | Readonly<{ kind: "permission-denied" }>
  | Readonly<{
      kind: "quota-exceeded"
      reason: "admin-day" | "admin-minute" | "in-flight" | "ip-minute"
      retryAfterSeconds: number
    }>
  | Readonly<{ kind: "provider-unavailable" }>
  | Readonly<{
      kind: "validation-failed"
      reason: string
    }>
  | Readonly<{ kind: "conflict"; reason: string }>
  | Readonly<{ kind: "not-found"; target: string }>
  | Readonly<{
      kind: "reporting-unavailable"
      sources: readonly ("content" | "identity" | "learning")[]
    }>
  | Readonly<{ kind: "persistence-failed"; operation: string }>
  | Readonly<{ kind: "provider-failed" }>
