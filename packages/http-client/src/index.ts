export type HttpFetch = (request: Request) => Promise<Response>

export type HttpNetworkErrorKind = "aborted" | "failed"

export type HttpNetworkError = {
  readonly cause: unknown
  readonly code: "network-error"
  readonly kind: HttpNetworkErrorKind
  readonly method: string
  readonly url: string
}

export type HttpFetchResult =
  | {
      readonly kind: "ok"
      readonly response: Response
    }
  | {
      readonly error: HttpNetworkError
      readonly kind: "network-error"
    }

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
  return {
    status: "ok",
    value,
  }
}

export function httpApiFailure<TError>(error: TError): HttpApiFailure<TError> {
  return {
    error,
    status: "error",
  }
}

export async function fetchHttpResponse(
  request: Request,
  fetch: HttpFetch
): Promise<HttpFetchResult> {
  try {
    return {
      kind: "ok",
      response: await fetch(request),
    }
  } catch (cause) {
    return {
      error: createHttpNetworkError(request, cause),
      kind: "network-error",
    }
  }
}

export function createHttpNetworkError(
  request: Request,
  cause: unknown
): HttpNetworkError {
  return {
    cause,
    code: "network-error",
    kind: classifyHttpNetworkError(cause),
    method: request.method,
    url: redactHttpUrl(request.url),
  }
}

function classifyHttpNetworkError(cause: unknown): HttpNetworkErrorKind {
  if (readErrorName(cause) === "AbortError") {
    return "aborted"
  }

  return "failed"
}

function readErrorName(cause: unknown): string | null {
  if (
    typeof cause === "object" &&
    cause !== null &&
    "name" in cause &&
    typeof cause.name === "string"
  ) {
    return cause.name
  }

  return null
}

function redactHttpUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)

    parsedUrl.hash = ""
    parsedUrl.search = ""

    return parsedUrl.toString()
  } catch {
    return url
  }
}
