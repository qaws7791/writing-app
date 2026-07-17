import { describe, expect, expectTypeOf, it } from "vitest"
import type { AnyRouteConfig } from "@/http/platform/core"

import {
  AdminRouteAssemblyError,
  assembleAdminCapabilityRoutes,
  createAdminRouteGroupRegistry,
} from "@/http/admin-route-registry"
import {
  adminRouteGroupOrder,
  defineAdminRouteGroup,
  type AdminRouteGroup,
  type AdminRouteGroupName,
  type AdminRouteGroupRegistry,
  type AdminRouteRegistration,
} from "@/http/admin-route-group"

describe("관리자 capability route registry", () => {
  it("정확한 여섯 slot을 타입과 고정 순서로 유지한다", () => {
    const registry = createAdminRouteGroupRegistry(createRouteGroups())

    expectTypeOf<
      keyof AdminRouteGroupRegistry
    >().toEqualTypeOf<AdminRouteGroupName>()
    expect(adminRouteGroupOrder).toEqual([
      "aiChat",
      "dashboardAnalytics",
      "content",
      "identity",
      "resourceLibrary",
      "settings",
    ])
    expect(Object.keys(registry)).toEqual(adminRouteGroupOrder)
    expect(assembleAdminCapabilityRoutes(registry)).toEqual([])
  })

  it("입력 object의 key 순서와 무관하게 고정된 capability 순서로 평탄화한다", () => {
    const routes = Object.fromEntries(
      [...adminRouteGroupOrder].reverse().map((group) => [
        group,
        defineAdminRouteGroup([
          createTestRoute({
            method: "get",
            operationId: `get-${group}`,
            path: `/${group}`,
          }),
        ]),
      ])
    ) as AdminRouteGroupRegistry

    expect(
      assembleAdminCapabilityRoutes(routes).map(
        (registration) => registration.route.operationId
      )
    ).toEqual(adminRouteGroupOrder.map((group) => `get-${group}`))
  })

  it("registry와 각 group을 복사한 뒤 runtime에서 변경할 수 없게 고정한다", () => {
    const sourceGroup = [
      createTestRoute({
        method: "get",
        operationId: "getAdminCourses",
        path: "/courses",
      }),
    ]
    const registry = createAdminRouteGroupRegistry(
      createRouteGroups({ content: sourceGroup })
    )
    sourceGroup.length = 0

    expect(Object.isFrozen(registry)).toBe(true)
    expect(Object.isFrozen(registry.content)).toBe(true)
    expect(registry.content).toHaveLength(1)
    expect(Reflect.set(registry, "content", [])).toBe(false)
    expect(Reflect.set(registry.content, 0, undefined)).toBe(false)
  })

  it("누락되거나 정의되지 않은 slot을 시작 시 거절한다", () => {
    const missingSettings = createRouteGroups()
    const unexpected = createRouteGroups()
    Reflect.deleteProperty(missingSettings, "settings")
    Reflect.set(unexpected, "audit", defineAdminRouteGroup([]))

    expectAssemblyFailure(
      () => createAdminRouteGroupRegistry(missingSettings),
      "missing-route-group"
    )
    expectAssemblyFailure(
      () => createAdminRouteGroupRegistry(unexpected),
      "unexpected-route-group"
    )
  })

  it("같은 method와 path의 중복을 capability 경계와 무관하게 거절한다", () => {
    const first = createTestRoute({
      method: "get",
      operationId: "getAdminCourses",
      path: "/courses",
    })
    const second = createTestRoute({
      method: "get",
      operationId: "findAdminCourses",
      path: "/courses",
    })

    expectAssemblyFailure(
      () =>
        assembleAdminCapabilityRoutes(
          createRouteGroups({
            content: [first],
            settings: [second],
          })
        ),
      "duplicate-method-path"
    )
  })

  it("같은 path라도 method가 다르면 별도 route로 유지한다", () => {
    const routes = assembleAdminCapabilityRoutes(
      createRouteGroups({
        content: [
          createTestRoute({
            method: "get",
            operationId: "getAdminCourses",
            path: "/courses",
          }),
          createTestRoute({
            method: "post",
            operationId: "createAdminCourse",
            path: "/courses",
          }),
        ],
      })
    )

    expect(routes).toHaveLength(2)
  })

  it("서로 다른 route의 같은 operationId를 거절한다", () => {
    expectAssemblyFailure(
      () =>
        assembleAdminCapabilityRoutes(
          createRouteGroups({
            content: [
              createTestRoute({
                method: "get",
                operationId: "getAdminOverview",
                path: "/courses",
              }),
            ],
            dashboardAnalytics: [
              createTestRoute({
                method: "get",
                operationId: "getAdminOverview",
                path: "/dashboard",
              }),
            ],
          })
        ),
      "duplicate-operation-id"
    )
  })

  it.each(["/health", "/openapi", "/session"])(
    "공통 기반 path %s를 feature route가 소유하지 못하게 한다",
    (path) => {
      expectAssemblyFailure(
        () =>
          assembleAdminCapabilityRoutes(
            createRouteGroups({
              content: [
                createTestRoute({
                  method: "post",
                  operationId: `feature-${path}`,
                  path,
                }),
              ],
            })
          ),
        "reserved-foundation-path"
      )
    }
  )

  it.each(["/api/auth", "/api/auth/*", "/api/auth/change-password"])(
    "인증 namespace %s를 feature route가 소유하지 못하게 한다",
    (path) => {
      expectAssemblyFailure(
        () =>
          assembleAdminCapabilityRoutes(
            createRouteGroups({
              identity: [
                createTestRoute({
                  method: "get",
                  operationId: `feature-${path}`,
                  path,
                }),
              ],
            })
          ),
        "reserved-auth-path"
      )
    }
  )

  it("인증 namespace와 이름만 비슷한 feature path는 허용한다", () => {
    expect(
      assembleAdminCapabilityRoutes(
        createRouteGroups({
          identity: [
            createTestRoute({
              method: "get",
              operationId: "getAdminAuthorizationReport",
              path: "/api/authorization-report",
            }),
          ],
        })
      )
    ).toHaveLength(1)
  })

  it.each(["getAdminHealth", "getAdminSession"])(
    "공통 기반 operationId %s를 feature route가 재사용하지 못하게 한다",
    (operationId) => {
      expectAssemblyFailure(
        () =>
          assembleAdminCapabilityRoutes(
            createRouteGroups({
              settings: [
                createTestRoute({
                  method: "get",
                  operationId,
                  path: "/settings",
                }),
              ],
            })
          ),
        "reserved-foundation-operation-id"
      )
    }
  )
})

function createRouteGroups(
  overrides: Partial<AdminRouteGroupRegistry> = {}
): AdminRouteGroupRegistry {
  const empty = defineAdminRouteGroup([])

  return {
    aiChat: empty,
    dashboardAnalytics: empty,
    content: empty,
    identity: empty,
    resourceLibrary: empty,
    settings: empty,
    ...overrides,
  }
}

function createTestRoute(input: {
  readonly method: AnyRouteConfig["method"]
  readonly operationId: string
  readonly path: string
}): AdminRouteRegistration {
  return {
    handler: () => new Response(),
    route: {
      method: input.method,
      operationId: input.operationId,
      path: input.path,
      responses: {
        200: { description: "테스트 응답" },
      },
    },
  }
}

function expectAssemblyFailure(
  assemble: () => AdminRouteGroupRegistry | AdminRouteGroup,
  kind: AdminRouteAssemblyError["failure"]["kind"]
): void {
  expect(assemble).toThrow(AdminRouteAssemblyError)

  try {
    assemble()
  } catch (error) {
    expect(error).toBeInstanceOf(AdminRouteAssemblyError)
    expect((error as AdminRouteAssemblyError).failure.kind).toBe(kind)
  }
}
