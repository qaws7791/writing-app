import { afterEach, beforeEach } from "vitest"

type ConsoleFailureMethod = "error" | "warn"

const testConsole = Reflect.get(globalThis, "console") as Console
const originalConsole = {
  error: testConsole.error,
  warn: testConsole.warn,
}

export function installConsoleFailureHarness(): void {
  beforeEach(() => {
    testConsole.error = createConsoleFailure("error")
    testConsole.warn = createConsoleFailure("warn")
  })

  afterEach(() => {
    testConsole.error = originalConsole.error
    testConsole.warn = originalConsole.warn
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
