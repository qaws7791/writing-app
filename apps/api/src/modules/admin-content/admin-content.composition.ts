import { createAdminCourseUseCase } from "@workspace/core/content"

import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import { createAdminCourseRepository } from "@/adapters/content/admin-course-drizzle.repository"
import { createAdminContentRoutes } from "@/modules/admin-content/admin-content.routes"

export function composeAdminContentRouteGroup(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  return createAdminContentRoutes({
    courseService: createAdminCourseUseCase(
      createAdminCourseRepository(context.database)
    ),
    now: context.now,
    sessionResolver: context.sessionResolver,
  })
}
