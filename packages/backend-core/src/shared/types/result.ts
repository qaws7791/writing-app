/**
 * Result type for operations that may fail.
 * Enables better error handling without exceptions.
 */

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export function ok<T, E>(value: T): Result<T, E> {
  return { ok: true, value }
}

export function err<T, E>(error: E): Result<T, E> {
  return { ok: false, error }
}

export function isOk<T, E>(
  result: Result<T, E>
): result is { ok: true; value: T } {
  return result.ok === true
}

export function isErr<T, E>(
  result: Result<T, E>
): result is { ok: false; error: E } {
  return result.ok === false
}

export function mapResult<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result
}

export function flatMapResult<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.value) : result
}
