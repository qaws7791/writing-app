import { err, ok, type Result } from "@workspace/kernel/result"

export type ManagedAiRuntime<TValue> = {
  readonly close: () => Promise<void>
  readonly value: TValue
}

export type AiRuntimeInitializationError = Readonly<{
  cause: unknown
  kind: "initialization-failed"
}>

type Cleanup = () => Promise<void> | void

export function createManagedAiRuntime<TValue>(
  initialize: (registerCleanup: (cleanup: Cleanup) => void) => TValue
): Result<ManagedAiRuntime<TValue>, AiRuntimeInitializationError> {
  const cleanups: Cleanup[] = []
  let closePromise: Promise<void> | undefined

  const close = (): Promise<void> => {
    closePromise ??= Promise.allSettled(
      [...cleanups].reverse().map(async (cleanup) => cleanup())
    ).then((results) => {
      const causes = results.flatMap((result) =>
        result.status === "rejected" ? [result.reason] : []
      )
      if (causes.length > 0) throw new AggregateError(causes)
    })
    return closePromise
  }

  try {
    return ok({ close, value: initialize((cleanup) => cleanups.push(cleanup)) })
  } catch (cause) {
    void close()
    return err({ cause, kind: "initialization-failed" })
  }
}
