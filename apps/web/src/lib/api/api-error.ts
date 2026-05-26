export type ApiError =
  | {
      code: "unauthorized"
      message: string
    }
  | {
      code: "not-found"
      message: string
    }
  | {
      code: "invalid-request"
      message: string
    }
  | {
      code: "retry-limit-exceeded"
      message: string
    }
  | {
      code: "unavailable"
      message: string
    }
  | {
      code: "network-error"
      message: string
    }
  | {
      code: "contract-error"
      message: string
    }

export function apiErrorFromResponseBody(
  status: number,
  body: unknown
): ApiError {
  const code = readCode(body)
  const message = readMessage(body)

  if (code === "unauthorized") {
    return { code: "unauthorized", message }
  }

  if (
    code === "course-not-found" ||
    code === "lesson-not-found" ||
    code === "answer-not-found" ||
    code === "feedback-step-not-found" ||
    status === 404
  ) {
    return { code: "not-found", message }
  }

  if (code === "invalid-request" || status === 400) {
    return { code: "invalid-request", message }
  }

  if (code === "feedback-retry-limit-exceeded" || status === 429) {
    return { code: "retry-limit-exceeded", message }
  }

  if (
    status >= 500 ||
    code === "database-unavailable" ||
    code === "ai-feedback-unavailable"
  ) {
    return { code: "unavailable", message: "API is unavailable." }
  }

  return {
    code: "contract-error",
    message: "API response did not match the expected contract.",
  }
}

export function networkApiError(): ApiError {
  return {
    code: "network-error",
    message: "Network request failed.",
  }
}

function readCode(body: unknown) {
  if (hasStringProperty(body, "code")) {
    return body.code
  }

  return undefined
}

function readMessage(body: unknown) {
  if (hasStringProperty(body, "message")) {
    return body.message
  }

  return "API request failed."
}

function hasStringProperty<TKey extends string>(
  value: unknown,
  key: TKey
): value is { readonly [TProperty in TKey]: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    key in value &&
    typeof value[key as keyof typeof value] === "string"
  )
}
