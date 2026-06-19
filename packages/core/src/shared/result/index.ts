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
