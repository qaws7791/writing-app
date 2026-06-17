import type { AdminRepository } from "@workspace/core/admin"

import type { KwepDatabase } from "@workspace/db/client"
import { createAdminAnalyticsRepository } from "@workspace/db/repositories/admin-analytics.repository"
import {
  createAdminCourseRepository,
  type DrizzleAdminRepositoryDependencies,
} from "@workspace/db/repositories/admin-course.repository"
import { createAdminDashboardRepository } from "@workspace/db/repositories/admin-dashboard.repository"
import { createAdminSettingsRepository } from "@workspace/db/repositories/admin-settings.repository"
import { createAdminUserRepository } from "@workspace/db/repositories/admin-user.repository"

export type { DrizzleAdminRepositoryDependencies } from "@workspace/db/repositories/admin-course.repository"

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
