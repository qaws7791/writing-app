import type { AnyRouteConfig } from "@workspace/http-platform/core"

import type { ContentApplication } from "#content/application/content-application"
import type { ContentAdminSessionPort } from "#content/application/ports/content-ports"
import { createAdminContentResetRoute } from "#content/interface/http/admin-content-reset-route"
import { createAdminCourseRoutes } from "#content/interface/http/admin-course-routes"
import { createAdminCurriculumRoutes } from "#content/interface/http/admin-curriculum-routes"

export type ContentHttpRouteGroup = readonly {
  readonly handler: unknown
  readonly route: AnyRouteConfig
}[]

export function createAdminContentRoutes(dependencies: {
  readonly application: ContentApplication
  readonly sessionPort: ContentAdminSessionPort
}): ContentHttpRouteGroup {
  return Object.freeze([
    ...createAdminCourseRoutes(dependencies),
    ...createAdminCurriculumRoutes(dependencies),
    createAdminContentResetRoute(dependencies),
  ])
}

export type { ContentAdminHonoEnv } from "#content/interface/http/content-http-auth"
