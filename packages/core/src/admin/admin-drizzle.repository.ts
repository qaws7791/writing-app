import type { AdminRepository } from "@workspace/core/admin"

import type { KwepDatabase } from "@workspace/db/client"
import { createAdminAnalyticsRepository } from "@workspace/core/admin/admin-analytics-drizzle.repository"
import {
  createAdminCourseRepository,
  type DrizzleAdminRepositoryDependencies,
} from "@workspace/core/admin/admin-course-drizzle.repository"
import { createAdminDashboardRepository } from "@workspace/core/admin/admin-dashboard-drizzle.repository"
import { createAdminSettingsRepository } from "@workspace/core/admin/admin-settings-drizzle.repository"
import { createAdminUserRepository } from "@workspace/core/admin/admin-user-drizzle.repository"

export type { DrizzleAdminRepositoryDependencies } from "@workspace/core/admin/admin-course-drizzle.repository"

export function createDrizzleAdminRepository(
  db: KwepDatabase,
  dependencies: DrizzleAdminRepositoryDependencies = {}
): AdminRepository {
  return {
    ...createAdminCourseRepository(db, dependencies),
    ...createAdminUserRepository(db),
    ...createAdminDashboardRepository(db),
    ...createAdminAnalyticsRepository(db),
    ...createAdminSettingsRepository(db),
  }
}
