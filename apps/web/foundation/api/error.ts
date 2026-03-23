export type ApiError = Error & {
  code?: "remote_api_error" | "unauthorized"
  status: number
}

export function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError
  error.code = status === 401 ? "unauthorized" : "remote_api_error"
  error.status = status
  return error
}

type ErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

export function throwOnError<T>(result: {
  data?: T
  error?: ErrorBody
  response: Response
}): T {
  if (result.data !== undefined) {
    return result.data
  }

  const message = result.error?.error?.message ?? "API 요청에 실패했습니다."
  throw createApiError(result.response.status, message)
}
