export type OkResult<TValue> = {
  status: "ok"
  value: TValue
}

export type ErrorResult<TStatus extends string, TError> = {
  status: TStatus
  error: TError
}

export type NotFoundResult<TError> = ErrorResult<"not-found", TError>

export type InvalidRequestResult<TError> = ErrorResult<
  "invalid-request",
  TError
>

export type InvalidContentResult<TError> = ErrorResult<
  "invalid-content",
  TError
>

export type UnavailableResult<TError> = ErrorResult<"unavailable", TError>

export type ConflictResult<TError> = ErrorResult<"conflict", TError>
