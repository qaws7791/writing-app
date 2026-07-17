import {
  defineAdminRouteGroup,
  type AdminRouteGroup,
} from "@/http/admin-route-group"
import {
  createCoursesRoutes,
  type CoursesRouteDependencies,
} from "@/modules/admin-content/courses.routes"
import {
  createCurriculumEditorRoutes,
  type CurriculumEditorRouteDependencies,
} from "@/modules/admin-content/curriculum-editor.routes"

export type AdminContentRouteDependencies = CoursesRouteDependencies &
  CurriculumEditorRouteDependencies

export function createAdminContentRoutes(
  dependencies: AdminContentRouteDependencies
): AdminRouteGroup {
  return defineAdminRouteGroup([
    ...createCoursesRoutes(dependencies),
    ...createCurriculumEditorRoutes(dependencies),
  ])
}
