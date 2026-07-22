import { ResultAsync } from "@workspace/kernel/result"

export type LoggerShutdownError = Readonly<{
  cause: unknown
  kind: "logger-shutdown-failed"
  phase: "flush"
}>

export function shutdownLogger(input: {
  readonly close: () => Promise<void> | void
  readonly flush: () => Promise<void> | void
  readonly onError: (error: LoggerShutdownError) => void
}): ResultAsync<void, LoggerShutdownError> {
  return ResultAsync.fromPromise(
    (async () => {
      try {
        await input.flush()
      } catch (cause) {
        const error: LoggerShutdownError = {
          cause,
          kind: "logger-shutdown-failed",
          phase: "flush",
        }
        input.onError(error)
        throw error
      } finally {
        await input.close()
      }
    })(),
    (cause) =>
      isLoggerShutdownError(cause)
        ? cause
        : { cause, kind: "logger-shutdown-failed", phase: "flush" }
  )
}

function isLoggerShutdownError(value: unknown): value is LoggerShutdownError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "logger-shutdown-failed"
  )
}
