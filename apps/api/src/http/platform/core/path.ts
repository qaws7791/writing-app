const HONO_PARAMETER_SEGMENT_PATTERN = /^:.+$/

export function assertOpenApiPath(path: string): void {
  const invalidSegment = path
    .split("/")
    .find((segment) => HONO_PARAMETER_SEGMENT_PATTERN.test(segment))

  if (!invalidSegment) {
    return
  }

  const parameterName = invalidSegment.slice(1)

  throw new Error(
    `Invalid route path "${path}". Use OpenAPI path parameters like "/users/{${parameterName}}", not Hono-style "/users/${invalidSegment}".`
  )
}
