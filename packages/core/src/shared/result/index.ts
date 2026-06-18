import {
  err as appErr,
  ok as appOk,
  ResultAsync,
  type Result as NeverthrowResult,
} from "neverthrow"

import type { AppError } from "@workspace/core/shared/errors"

export type AppResult<
  TValue,
  TError extends AppError = AppError,
> = NeverthrowResult<TValue, TError>

export type AppAsyncResult<
  TValue,
  TError extends AppError = AppError,
> = ResultAsync<TValue, TError>

export { appErr, appOk, ResultAsync }

export function fromPromise<TValue, TError extends AppError>(
  promise: Promise<TValue>,
  mapError: (error: unknown) => TError
): AppAsyncResult<TValue, TError> {
  return ResultAsync.fromPromise(promise, mapError)
}

export type Ok<TValue> = {
  readonly kind: "ok"
  readonly value: TValue
}

export type Err<TError> = {
  readonly kind: "err"
  readonly error: TError
}

export type Result<TValue, TError> = Ok<TValue> | Err<TError>

export function ok<TValue>(value: TValue): Ok<TValue> {
  return {
    kind: "ok",
    value,
  }
}

export function err<TError>(error: TError): Err<TError> {
  return {
    kind: "err",
    error,
  }
}
