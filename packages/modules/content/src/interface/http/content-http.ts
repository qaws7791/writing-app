import type { OpenAPIHono } from "@hono/zod-openapi"

import type { ContentApplication } from "#content/application/content-application"
import type { ContentAdminSessionPort } from "#content/application/ports/content-ports"
import { registerAdminContentAssetRoutes } from "#content/interface/http/admin-content-asset-routes"
import { registerAdminCourseRoutes } from "#content/interface/http/admin-course-routes"
import { registerAdminCurriculumRoutes } from "#content/interface/http/admin-curriculum-routes"
import type { ContentAdminHonoEnv } from "#content/interface/http/content-http-auth"

export function registerContentRoutes<TEnv extends ContentAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  dependencies: {
    readonly application: ContentApplication
    readonly sessionPort: ContentAdminSessionPort
  }
): void {
  registerAdminContentAssetRoutes(app, dependencies)
  registerAdminCourseRoutes(app, dependencies)
  registerAdminCurriculumRoutes(app, dependencies)
}

export type { ContentAdminHonoEnv } from "#content/interface/http/content-http-auth"
