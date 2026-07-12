import type { AdminRepository } from "#core/modules/admin/application/ports/admin.repository"

import type { WritingAppDatabase } from "@workspace/db/client"
import { createAdminAiChatRepository } from "#core/modules/admin/infrastructure/persistence/admin-ai-chat-drizzle.repository"
import { createAdminAnalyticsRepository } from "#core/modules/admin/infrastructure/persistence/admin-analytics-drizzle.repository"
import {
  createAdminCourseRepository,
  type DrizzleAdminRepositoryDependencies,
} from "#core/modules/admin/infrastructure/persistence/admin-course-drizzle.repository"
import { createAdminDashboardRepository } from "#core/modules/admin/infrastructure/persistence/admin-dashboard-drizzle.repository"
import { createAdminSettingsRepository } from "#core/modules/admin/infrastructure/persistence/admin-settings-drizzle.repository"
import { createAdminUserRepository } from "#core/modules/admin/infrastructure/persistence/admin-user-drizzle.repository"

export type { DrizzleAdminRepositoryDependencies } from "#core/modules/admin/infrastructure/persistence/admin-course-drizzle.repository"

export function createDrizzleAdminRepository(
  db: WritingAppDatabase,
  dependencies: DrizzleAdminRepositoryDependencies = {}
): AdminRepository {
  return {
    ...createAdminAiChatRepository(db),
    ...createAdminCourseRepository(db, dependencies),
    ...createAdminUserRepository(db),
    ...createAdminDashboardRepository(db),
    ...createAdminAnalyticsRepository(db),
    ...createAdminSettingsRepository(db),
  }
}
