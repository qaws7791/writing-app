export type InfrastructureError =
  | Readonly<{
      dependency: string
      kind: "dependency-unavailable"
      retryable: boolean
    }>
  | Readonly<{
      kind: "operation-failed"
      operation: string
      retryable: boolean
    }>
  | Readonly<{
      kind: "operation-timed-out"
      operation: string
      timeoutMs: number
    }>
