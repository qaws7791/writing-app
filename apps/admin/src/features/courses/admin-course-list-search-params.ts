import {
  adminCourseListInputDtoSchema,
  adminCourseListPageSizeSchema,
  type AdminCourseListInputDto,
} from "@workspace/core/admin"

type SearchParams = Record<string, string | string[] | undefined>

const defaultAdminCourseListInput = {
  page: 1,
  pageSize: 10,
  query: "",
} satisfies AdminCourseListInputDto

export function parseAdminCourseListSearchParams(
  searchParams: SearchParams
): AdminCourseListInputDto {
  const input = {
    page: parsePositiveIntegerParam(
      firstParam(searchParams["page"]),
      defaultAdminCourseListInput.page
    ),
    pageSize: parsePageSizeParam(firstParam(searchParams["pageSize"])),
    query: firstParam(searchParams["query"])?.trim() ?? "",
  }
  const parsedInput = adminCourseListInputDtoSchema.safeParse(input)

  return parsedInput.success ? parsedInput.data : defaultAdminCourseListInput
}

export function createAdminCourseListPath(input: {
  page: number
  pageSize: number
  query: string
}) {
  const canonicalInput = parseAdminCourseListSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
    query: input.query,
  })
  const params = new URLSearchParams()

  params.set("page", String(canonicalInput.page))
  params.set("pageSize", String(canonicalInput.pageSize))

  if (canonicalInput.query.length > 0) {
    params.set("query", canonicalInput.query)
  }

  return `/courses?${params.toString()}`
}

function parsePageSizeParam(value: string | undefined) {
  const pageSize = parsePositiveIntegerParam(
    value,
    defaultAdminCourseListInput.pageSize
  )
  const parsedPageSize = adminCourseListPageSizeSchema.safeParse(pageSize)

  return parsedPageSize.success
    ? parsedPageSize.data
    : defaultAdminCourseListInput.pageSize
}

function parsePositiveIntegerParam(
  value: string | undefined,
  fallback: number
) {
  if (value === undefined || !/^\d+$/.test(value)) {
    return fallback
  }

  const parsedValue = Number(value)

  return parsedValue > 0 ? parsedValue : fallback
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
