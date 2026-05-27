import type {
  AdminApi,
  AdminApiErrorDto,
  AdminApiResult,
} from "@/lib/api/admin-api"

const courseTreeInclude = "chapters,lessons"

type AdminApiFetch = (request: Request) => Promise<Response>

type JsonObject = {
  code?: unknown
  message?: unknown
}

interface CreateHttpAdminApiInput {
  baseUrl: string
  fetch?: AdminApiFetch
  headers?: HeadersInit
}

export function createHttpAdminApi({
  baseUrl,
  fetch: fetcher = fetch,
  headers,
}: CreateHttpAdminApiInput): AdminApi {
  return {
    listCourseTree() {
      const url = createAdminApiUrl(baseUrl, "/courses")
      url.searchParams.set("include", courseTreeInclude)

      return requestJson(fetcher, url, headers)
    },
    listUsers() {
      return requestJson(fetcher, createAdminApiUrl(baseUrl, "/users"), headers)
    },
  }
}

async function requestJson<TValue>(
  fetcher: AdminApiFetch,
  url: URL,
  headers: HeadersInit | undefined
): Promise<AdminApiResult<TValue>> {
  const response = await fetcher(
    new Request(url, {
      credentials: "include",
      headers,
      method: "GET",
    })
  )

  if (!response.ok) {
    return {
      status: "error",
      error: await readError(response),
      httpStatus: response.status,
    }
  }

  return {
    status: "ok",
    value: (await response.json()) as TValue,
  }
}

function createAdminApiUrl(baseUrl: string, path: string) {
  return new URL(path, withTrailingSlash(baseUrl))
}

function withTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`
}

async function readError(response: Response): Promise<AdminApiErrorDto> {
  const body = await readJson(response)

  if (isAdminApiErrorDto(body)) {
    return body
  }

  return {
    code: "unknown-error",
    message: `Admin API request failed with status ${response.status}.`,
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function isAdminApiErrorDto(value: unknown): value is AdminApiErrorDto {
  if (!isJsonObject(value) || typeof value.message !== "string") {
    return false
  }

  return (
    value.code === "database-unavailable" ||
    value.code === "invalid-request" ||
    value.code === "unknown-error"
  )
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null
}
