export type HttpApiOk<TValue> = {
  readonly status: "ok"
  readonly value: TValue
}

export type HttpApiFailure<TError> = {
  readonly error: TError
  readonly status: "error"
}

export type HttpApiResult<TValue, TError> =
  | HttpApiOk<TValue>
  | HttpApiFailure<TError>

export function httpApiOk<TValue>(value: TValue): HttpApiOk<TValue> {
  return { status: "ok", value }
}

export function httpApiFailure<TError>(error: TError): HttpApiFailure<TError> {
  return { error, status: "error" }
}
