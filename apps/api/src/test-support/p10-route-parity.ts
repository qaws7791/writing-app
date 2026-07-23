export type ApiRouteParityEntry = Readonly<{
  access: "protected" | "public"
  audience: "admin" | "learner"
  classification: "approved-addition" | "baseline"
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT"
  path: string
}>

const p10RouteParity = Object.freeze([
  learner("GET", "/health", "baseline", "public"),
  learner("GET", "/health/live", "approved-addition", "public"),
  learner("GET", "/auth/session"),
  learner("GET", "/profile"),
  learner("GET", "/courses"),
  learner("GET", "/course-categories"),
  learner("GET", "/courses/{courseId}"),
  learner("GET", "/lessons/{lessonId}"),
  learner("GET", "/progress"),
  learner("POST", "/learning/lessons/{lessonId}/start"),
  learner("POST", "/learning/lessons/{lessonId}/steps/{stepId}/complete"),
  learner("POST", "/learning/lessons/{lessonId}/steps/{stepId}/ai-feedback"),
  admin("GET", "/api/admin/health", "baseline", "public"),
  admin("GET", "/api/admin/health/live", "approved-addition", "public"),
  admin("GET", "/api/admin/session"),
  admin("GET", "/api/admin/courses"),
  admin("POST", "/api/admin/courses"),
  admin("DELETE", "/api/admin/courses/{courseId}"),
  admin("GET", "/api/admin/courses/{courseId}/editor"),
  admin("PUT", "/api/admin/courses/{courseId}/editor"),
  admin("POST", "/api/admin/courses/{courseId}/publish"),
  admin("POST", "/api/admin/settings/content-reset"),
  admin("GET", "/api/admin/users"),
  admin("GET", "/api/admin/users/{userId}"),
  admin("PATCH", "/api/admin/users/{userId}/status"),
  admin("DELETE", "/api/admin/users/{userId}"),
  admin("GET", "/api/admin/ai-chat/conversations"),
  admin("GET", "/api/admin/ai-chat/conversations/{conversationId}"),
  admin("POST", "/api/admin/ai-chat/messages/stream"),
  admin(
    "GET",
    "/api/admin/ai-chat/proposals/{proposalId}",
    "approved-addition"
  ),
  admin(
    "POST",
    "/api/admin/ai-chat/proposals/{proposalId}/approve",
    "approved-addition"
  ),
  admin(
    "POST",
    "/api/admin/ai-chat/proposals/{proposalId}/reject",
    "approved-addition"
  ),
  admin("GET", "/api/admin/dashboard"),
  admin("GET", "/api/admin/analytics"),
  admin("GET", "/api/admin/analytics/lessons"),
  admin("GET", "/api/admin/settings"),
  admin("PUT", "/api/admin/settings/notice"),
  admin("PUT", "/api/admin/settings/legal"),
  admin("GET", "/api/admin/resources/tree"),
  admin("POST", "/api/admin/resources/folders"),
  admin("POST", "/api/admin/resources/documents"),
  admin("PATCH", "/api/admin/resources/folders/{folderId}/name"),
  admin("PATCH", "/api/admin/resources/nodes/{nodeId}/move"),
  admin("POST", "/api/admin/resources/nodes/{nodeId}/trash"),
  admin("POST", "/api/admin/resources/nodes/{nodeId}/restore"),
  admin("DELETE", "/api/admin/resources/nodes/{nodeId}"),
  admin("POST", "/api/admin/resources/documents/{documentId}/images"),
  admin("GET", "/api/admin/resources/documents/{documentId}"),
  admin("PUT", "/api/admin/resources/documents/{documentId}"),
  admin("POST", "/api/admin/resources/documents/import"),
  admin("GET", "/api/admin/resources/documents/{documentId}/export"),
  admin("GET", "/api/admin/resources/search"),
] satisfies readonly ApiRouteParityEntry[])

function learner(
  method: ApiRouteParityEntry["method"],
  path: string,
  classification: ApiRouteParityEntry["classification"] = "baseline",
  access: ApiRouteParityEntry["access"] = "protected"
): ApiRouteParityEntry {
  return { access, audience: "learner", classification, method, path }
}

function admin(
  method: ApiRouteParityEntry["method"],
  path: string,
  classification: ApiRouteParityEntry["classification"] = "baseline",
  access: ApiRouteParityEntry["access"] = "protected"
): ApiRouteParityEntry {
  return { access, audience: "admin", classification, method, path }
}

export function readOpenApiRouteKeys(document: unknown): readonly string[] {
  const paths = readOpenApiPaths(document)

  return Object.entries(paths)
    .flatMap(([path, pathItem]) => {
      if (typeof pathItem !== "object" || pathItem === null) return []
      return Object.keys(pathItem)
        .filter((method) =>
          ["delete", "get", "patch", "post", "put"].includes(method)
        )
        .map((method) => `${method.toUpperCase()} ${path}`)
    })
    .sort()
}

export function readProtectedOpenApiRouteKeys(
  document: unknown,
  securityScheme: "adminSessionCookie" | "learnerSessionCookie"
): readonly string[] {
  const paths = readOpenApiPaths(document)

  return Object.entries(paths)
    .flatMap(([path, pathItem]) => {
      if (typeof pathItem !== "object" || pathItem === null) return []
      return Object.entries(pathItem).flatMap(([method, operation]) => {
        if (
          !["delete", "get", "patch", "post", "put"].includes(method) ||
          typeof operation !== "object" ||
          operation === null ||
          !("security" in operation) ||
          !Array.isArray(operation.security)
        ) {
          return []
        }
        const isProtected = operation.security.some(
          (requirement: unknown) =>
            typeof requirement === "object" &&
            requirement !== null &&
            securityScheme in requirement
        )
        return isProtected ? [`${method.toUpperCase()} ${path}`] : []
      })
    })
    .sort()
}

function readOpenApiPaths(
  document: unknown
): Readonly<Record<string, unknown>> {
  if (
    typeof document !== "object" ||
    document === null ||
    !("paths" in document) ||
    typeof document.paths !== "object" ||
    document.paths === null
  ) {
    throw new Error("OpenAPI document에 paths 객체가 필요합니다.")
  }

  return document.paths as Readonly<Record<string, unknown>>
}

export function expectedOpenApiRouteKeys(
  audience: ApiRouteParityEntry["audience"]
): readonly string[] {
  return p10RouteParity
    .filter((route) => route.audience === audience)
    .map((route) => `${route.method} ${route.path}`)
    .sort()
}

export function expectedProtectedOpenApiRouteKeys(
  audience: ApiRouteParityEntry["audience"]
): readonly string[] {
  return p10RouteParity
    .filter(
      (route) => route.audience === audience && route.access === "protected"
    )
    .map((route) => `${route.method} ${route.path}`)
    .sort()
}
