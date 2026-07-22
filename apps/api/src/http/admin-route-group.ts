import type { AnyRouteConfig } from "@workspace/http-platform/core"

export const adminRouteGroupOrder = Object.freeze([
  "content",
  "identity",
  "operations",
  "resourceLibrary",
] as const)

export type AdminRouteGroupName = (typeof adminRouteGroupOrder)[number]

export type AdminRouteRegistration = {
  readonly handler: unknown
  readonly route: AnyRouteConfig
}

export type AdminRouteGroup = readonly AdminRouteRegistration[]

export type AdminRouteGroupRegistry = Readonly<{
  readonly [TName in AdminRouteGroupName]: AdminRouteGroup
}>

export function defineAdminRouteGroup(
  routes: readonly AdminRouteRegistration[]
): AdminRouteGroup {
  return Object.freeze([...routes])
}
