import {
  adminRouteGroupOrder,
  type AdminRouteGroup,
  type AdminRouteGroupName,
  type AdminRouteGroupRegistry,
  type AdminRouteRegistration,
} from "@/http/admin-route-group"

const reservedFoundationPaths = ["/health", "/openapi", "/session"] as const
const reservedFoundationOperationIds = [
  "getAdminHealth",
  "getAdminSession",
] as const
const reservedAdminAuthPath = "/api/auth"

export type AdminRouteSource = {
  readonly group: AdminRouteGroupName
  readonly index: number
  readonly method: string
  readonly operationId?: string
  readonly path: string
}

export type AdminRouteAssemblyFailure =
  | {
      readonly group: AdminRouteGroupName
      readonly kind: "missing-route-group"
    }
  | {
      readonly group: string
      readonly kind: "unexpected-route-group"
    }
  | {
      readonly first: AdminRouteSource
      readonly kind: "duplicate-method-path"
      readonly second: AdminRouteSource
    }
  | {
      readonly first: AdminRouteSource
      readonly kind: "duplicate-operation-id"
      readonly second: AdminRouteSource
    }
  | {
      readonly kind: "reserved-foundation-path"
      readonly source: AdminRouteSource
    }
  | {
      readonly kind: "reserved-auth-path"
      readonly source: AdminRouteSource
    }
  | {
      readonly kind: "reserved-foundation-operation-id"
      readonly source: AdminRouteSource
    }

export class AdminRouteAssemblyError extends Error {
  readonly failure: AdminRouteAssemblyFailure

  constructor(failure: AdminRouteAssemblyFailure) {
    super(formatAssemblyFailure(failure))
    this.failure = failure
    this.name = "AdminRouteAssemblyError"
  }
}

export function createAdminRouteGroupRegistry(
  groups: AdminRouteGroupRegistry
): AdminRouteGroupRegistry {
  assertExactRouteGroupSlots(groups)

  return Object.freeze({
    aiChat: Object.freeze([...groups.aiChat]),
    dashboardAnalytics: Object.freeze([...groups.dashboardAnalytics]),
    content: Object.freeze([...groups.content]),
    identity: Object.freeze([...groups.identity]),
    resourceLibrary: Object.freeze([...groups.resourceLibrary]),
    settings: Object.freeze([...groups.settings]),
  })
}

export function assembleAdminCapabilityRoutes(
  groups: AdminRouteGroupRegistry
): AdminRouteGroup {
  const registry = createAdminRouteGroupRegistry(groups)
  const routes: AdminRouteRegistration[] = []
  const routesByMethodAndPath = new Map<string, AdminRouteSource>()
  const routesByOperationId = new Map<string, AdminRouteSource>()

  for (const group of adminRouteGroupOrder) {
    for (const [index, registration] of registry[group].entries()) {
      const source = readRouteSource(group, index, registration)
      assertRouteIsNotReserved(source)
      assertNoRouteCollision(source, routesByMethodAndPath)
      assertNoOperationIdCollision(source, routesByOperationId)
      routes.push(registration)
    }
  }

  return Object.freeze(routes)
}

function assertExactRouteGroupSlots(groups: AdminRouteGroupRegistry): void {
  const actualGroups = Object.keys(groups)

  for (const group of adminRouteGroupOrder) {
    if (!actualGroups.includes(group)) {
      throw new AdminRouteAssemblyError({
        group,
        kind: "missing-route-group",
      })
    }
  }

  for (const group of actualGroups) {
    if (!adminRouteGroupOrder.includes(group as AdminRouteGroupName)) {
      throw new AdminRouteAssemblyError({
        group,
        kind: "unexpected-route-group",
      })
    }
  }
}

function readRouteSource(
  group: AdminRouteGroupName,
  index: number,
  registration: AdminRouteRegistration
): AdminRouteSource {
  return {
    group,
    index,
    method: registration.route.method.toUpperCase(),
    operationId: registration.route.operationId,
    path: registration.route.path,
  }
}

function assertRouteIsNotReserved(source: AdminRouteSource): void {
  if (reservedFoundationPaths.some((path) => path === source.path)) {
    throw new AdminRouteAssemblyError({
      kind: "reserved-foundation-path",
      source,
    })
  }

  if (
    source.path === reservedAdminAuthPath ||
    source.path.startsWith(`${reservedAdminAuthPath}/`)
  ) {
    throw new AdminRouteAssemblyError({
      kind: "reserved-auth-path",
      source,
    })
  }

  if (
    source.operationId !== undefined &&
    reservedFoundationOperationIds.some(
      (operationId) => operationId === source.operationId
    )
  ) {
    throw new AdminRouteAssemblyError({
      kind: "reserved-foundation-operation-id",
      source,
    })
  }
}

function assertNoRouteCollision(
  source: AdminRouteSource,
  routesByMethodAndPath: Map<string, AdminRouteSource>
): void {
  const key = `${source.method} ${source.path}`
  const first = routesByMethodAndPath.get(key)

  if (first !== undefined) {
    throw new AdminRouteAssemblyError({
      first,
      kind: "duplicate-method-path",
      second: source,
    })
  }

  routesByMethodAndPath.set(key, source)
}

function assertNoOperationIdCollision(
  source: AdminRouteSource,
  routesByOperationId: Map<string, AdminRouteSource>
): void {
  if (source.operationId === undefined) return

  const first = routesByOperationId.get(source.operationId)

  if (first !== undefined) {
    throw new AdminRouteAssemblyError({
      first,
      kind: "duplicate-operation-id",
      second: source,
    })
  }

  routesByOperationId.set(source.operationId, source)
}

function formatAssemblyFailure(failure: AdminRouteAssemblyFailure): string {
  switch (failure.kind) {
    case "missing-route-group":
      return `관리자 route group이 누락됐습니다: ${failure.group}`
    case "unexpected-route-group":
      return `등록할 수 없는 관리자 route group입니다: ${failure.group}`
    case "duplicate-method-path":
      return `관리자 route가 중복됐습니다: ${formatRouteSource(failure.second)}`
    case "duplicate-operation-id":
      return `관리자 operationId가 중복됐습니다: ${failure.second.operationId}`
    case "reserved-foundation-path":
      return `관리자 공통 기반이 소유한 path입니다: ${formatRouteSource(failure.source)}`
    case "reserved-auth-path":
      return `관리자 인증 기반이 소유한 path입니다: ${formatRouteSource(failure.source)}`
    case "reserved-foundation-operation-id":
      return `관리자 공통 기반이 소유한 operationId입니다: ${failure.source.operationId}`
  }
}

function formatRouteSource(source: AdminRouteSource): string {
  return `${source.method} ${source.path} (${source.group}[${source.index}])`
}
