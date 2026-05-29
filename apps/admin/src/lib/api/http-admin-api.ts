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
    createCourseThumbnailUpload(input) {
      return requestJson(
        fetcher,
        createAdminApiUrl(baseUrl, "/course-thumbnails/uploads"),
        headers,
        {
          body: input,
          method: "POST",
        }
      )
    },
    listCourses(input) {
      const url = createAdminApiUrl(baseUrl, "/courses")
      url.searchParams.set("page", String(input.page))
      url.searchParams.set("pageSize", String(input.pageSize))

      if (input.query.trim().length > 0) {
        url.searchParams.set("query", input.query.trim())
      }

      return requestJson(fetcher, url, headers)
    },
    listCourseTree() {
      const url = createAdminApiUrl(baseUrl, "/courses")
      url.searchParams.set("include", courseTreeInclude)

      return requestJson(fetcher, url, headers)
    },
    getCourseDetail(courseId) {
      return requestJson(
        fetcher,
        createAdminApiUrl(baseUrl, `/courses/${encodePathSegment(courseId)}`),
        headers
      )
    },
    getCourseEditorDocument(courseId, versionId) {
      const url = createAdminApiUrl(
        baseUrl,
        `/courses/${encodePathSegment(courseId)}/editor`
      )

      if (versionId) {
        url.searchParams.set("version", versionId)
      }

      return requestJson(fetcher, url, headers)
    },
    listCurriculumVersions(courseId) {
      return requestJson(
        fetcher,
        createAdminApiUrl(
          baseUrl,
          `/courses/${encodePathSegment(courseId)}/curriculum/versions`
        ),
        headers
      )
    },
    getCourseCurriculumVersionDetail(courseId, versionId) {
      return requestJson(
        fetcher,
        createAdminApiUrl(
          baseUrl,
          `/courses/${encodePathSegment(courseId)}/curriculum/versions/${encodePathSegment(versionId)}`
        ),
        headers
      )
    },
    getCourseLessonDetail(courseId, versionId, lessonId) {
      const url = createAdminApiUrl(
        baseUrl,
        `/courses/${encodePathSegment(courseId)}/lessons/${encodePathSegment(lessonId)}`
      )
      url.searchParams.set("version", versionId)

      return requestJson(fetcher, url, headers)
    },
    createCurriculumDraft(courseId) {
      return requestJson(
        fetcher,
        createAdminApiUrl(
          baseUrl,
          `/courses/${encodePathSegment(courseId)}/curriculum/drafts`
        ),
        headers,
        {
          method: "POST",
        }
      )
    },
    restoreCurriculumDraft(courseId, input) {
      return requestJson(
        fetcher,
        createAdminApiUrl(
          baseUrl,
          `/courses/${encodePathSegment(courseId)}/curriculum/restores`
        ),
        headers,
        {
          body: input,
          method: "POST",
        }
      )
    },
    saveCurriculumVersionContent(input) {
      return requestJson(
        fetcher,
        createAdminApiUrl(
          baseUrl,
          `/courses/${encodePathSegment(input.courseId)}/curriculum/versions/${encodePathSegment(input.versionId)}/content`
        ),
        headers,
        {
          body: input,
          method: "PUT",
        }
      )
    },
    saveCourseEditorDocument(input) {
      return requestJson(
        fetcher,
        createAdminApiUrl(
          baseUrl,
          `/courses/${encodePathSegment(input.courseId)}/editor`
        ),
        headers,
        {
          body: input,
          method: "PUT",
        }
      )
    },
    publishCurriculumVersion(courseId, versionId) {
      return requestJson(
        fetcher,
        createAdminApiUrl(
          baseUrl,
          `/courses/${encodePathSegment(courseId)}/curriculum/versions/${encodePathSegment(versionId)}/publish`
        ),
        headers,
        {
          method: "POST",
        }
      )
    },
    discardCurriculumVersion(courseId, versionId) {
      return requestJson(
        fetcher,
        createAdminApiUrl(
          baseUrl,
          `/courses/${encodePathSegment(courseId)}/curriculum/versions/${encodePathSegment(versionId)}/discard`
        ),
        headers,
        {
          method: "POST",
        }
      )
    },
    listUsers() {
      return requestJson(fetcher, createAdminApiUrl(baseUrl, "/users"), headers)
    },
  }
}

async function requestJson<TValue>(
  fetcher: AdminApiFetch,
  url: URL,
  headers: HeadersInit | undefined,
  init: { method?: string; body?: unknown } = {}
): Promise<AdminApiResult<TValue>> {
  try {
    const requestHeaders = new Headers(headers)

    if (init.body !== undefined) {
      requestHeaders.set("content-type", "application/json")
    }

    const response = await fetcher(
      new Request(url, {
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        credentials: "include",
        headers: requestHeaders,
        method: init.method ?? "GET",
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
  } catch {
    return {
      status: "error",
      error: {
        code: "unknown-error",
        message: "관리자 API 요청에 실패했습니다.",
      },
      httpStatus: 0,
    }
  }
}

function createAdminApiUrl(baseUrl: string, path: string) {
  return new URL(path, withTrailingSlash(baseUrl))
}

function withTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value)
}

async function readError(response: Response): Promise<AdminApiErrorDto> {
  const body = await readJson(response)

  if (isAdminApiErrorDto(body)) {
    return body
  }

  return {
    code: "unknown-error",
    message: `관리자 API 요청에 실패했습니다. 상태: ${response.status}.`,
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
    value.code === "conflict" ||
    value.code === "database-unavailable" ||
    value.code === "invalid-request" ||
    value.code === "not-found" ||
    value.code === "storage-unavailable" ||
    value.code === "unknown-error"
  )
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null
}
