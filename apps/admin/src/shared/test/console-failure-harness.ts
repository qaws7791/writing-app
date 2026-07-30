import { afterEach, beforeEach } from "vitest"

type ConsoleFailureMethod = "error" | "warn"
type ConsoleFailureTarget = Pick<Console, ConsoleFailureMethod>

export type ConsoleFailureHarness = Readonly<{
  install: () => void
  restore: () => void
}>

/**
 * 원래 console 함수는 생성 시점에 한 번만 캡처한다. 설치 후에 다시 캡처하면
 * 실패 함수 자신을 원본으로 기억해 복원이 영구히 깨진다.
 */
export function createConsoleFailureHarness(
  target: ConsoleFailureTarget
): ConsoleFailureHarness {
  const original = {
    error: target.error,
    warn: target.warn,
  }

  return {
    install() {
      target.error = createConsoleFailure("error")
      target.warn = createConsoleFailure("warn")
    },
    restore() {
      target.error = original.error
      target.warn = original.warn
    },
  }
}

export function installConsoleFailureHarness(): void {
  const harness = createConsoleFailureHarness(
    Reflect.get(globalThis, "console") as Console
  )

  beforeEach(() => {
    harness.install()
  })

  afterEach(() => {
    harness.restore()
  })
}

function createUnexpectedConsoleError(
  method: ConsoleFailureMethod,
  values: readonly unknown[]
): Error {
  const message = values.map(formatConsoleValue).join(" ")

  return new Error(`예상하지 않은 console.${method}: ${message}`)
}

function createConsoleFailure(
  method: ConsoleFailureMethod
): (..._values: readonly unknown[]) => never {
  return (...values) => {
    throw createUnexpectedConsoleError(method, values)
  }
}

function formatConsoleValue(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? value.message
  }

  return typeof value === "string" ? value : String(value)
}
