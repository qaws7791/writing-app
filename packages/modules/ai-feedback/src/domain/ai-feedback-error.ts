export type AiFeedbackError =
  | Readonly<{
      kind: "attempt-limit-exceeded"
      remainingAttempts: 0
    }>
  | Readonly<{
      kind: "attempt-in-progress"
      remainingAttempts: number
      retryAfterSeconds: number
    }>
  | Readonly<{
      kind:
        | "provider-response-invalid"
        | "provider-timeout"
        | "provider-unavailable"
        | "request-aborted"
      remainingAttempts: number
    }>
  | Readonly<{
      kind: "persistence-failed"
      operation: "fail-attempt" | "reserve-attempt" | "succeed-attempt"
    }>

export function isAiFeedbackErrorRetryable(error: AiFeedbackError): boolean {
  return error.kind !== "attempt-limit-exceeded"
}
