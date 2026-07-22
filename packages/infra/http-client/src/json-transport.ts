export type HttpFetch = (request: Request) => Promise<Response>

export type HttpNetworkError = {
  readonly code: "network-error"
  readonly cause: unknown
  readonly kind: "aborted" | "failed"
  readonly method: string
  readonly url: string
}

export type HttpResponseSchema<TValue> = {
  readonly safeParse: (
    value: unknown
  ) =>
    | { readonly data: TValue; readonly success: true }
    | { readonly success: false }
}

export type HttpJsonResult<TValue> =
  | {
      readonly kind: "success"
      readonly status: number
      readonly value: TValue
    }
  | {
      readonly body: unknown
      readonly kind: "http-error"
      readonly status: number
    }
  | { readonly kind: "contract-error"; readonly status: number | null }
  | { readonly error: HttpNetworkError; readonly kind: "network-error" }

export type HttpFetchResult =
  | { readonly kind: "success"; readonly response: Response }
  | { readonly error: HttpNetworkError; readonly kind: "network-error" }

export async function requestHttpJson<TValue>(input: {
  readonly fetch: HttpFetch
  readonly request: Request
  readonly schema: HttpResponseSchema<TValue>
}): Promise<HttpJsonResult<TValue>> {
  const fetchResult = await fetchHttpResponse(input.request, input.fetch)
  if (fetchResult.kind === "network-error") return fetchResult

  const { response } = fetchResult
  const body = await readJson(response)
  if (body.kind === "contract-error") {
    return { kind: "contract-error", status: response.status }
  }
  if (!response.ok) {
    return { body: body.value, kind: "http-error", status: response.status }
  }

  const parsed = input.schema.safeParse(body.value)
  return parsed.success
    ? { kind: "success", status: response.status, value: parsed.data }
    : { kind: "contract-error", status: response.status }
}

export async function fetchHttpResponse(
  request: Request,
  fetch: HttpFetch
): Promise<HttpFetchResult> {
  try {
    return { kind: "success", response: await fetch(request) }
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
    code: "network-error",
    cause,
    kind: readErrorName(cause) === "AbortError" ? "aborted" : "failed",
    method: request.method,
    url: redactHttpUrl(request.url),
  }
}

async function readJson(
  response: Response
): Promise<
  | { readonly kind: "success"; readonly value: unknown }
  | { readonly kind: "contract-error" }
> {
  const text = await response.text()
  if (text.length === 0) return { kind: "success", value: null }

  try {
    return { kind: "success", value: JSON.parse(text) as unknown }
  } catch {
    return { kind: "contract-error" }
  }
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
