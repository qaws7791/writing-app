import type {
  AnalyticsReader,
  AiChatAdminRepository,
  ContentResetRepository,
  CourseAdminRepository,
  DashboardReader,
  ResourceAdminRepository,
  SettingsRepository,
  UserAdminRepository,
} from "@workspace/core/modules/admin/application/ports/admin.repository"
import {
  createAdminAnalyticsUseCase,
  type AdminAnalyticsUseCase,
} from "@workspace/core/modules/admin/application/use-cases/admin-analytics.use-case"
import {
  createAdminAiChatUseCase,
  type AdminAiChatUseCase,
} from "@workspace/core/modules/admin/application/use-cases/admin-ai-chat.use-case"
import {
  createAdminContentResetUseCase,
  type AdminContentResetUseCase,
} from "@workspace/core/modules/admin/application/use-cases/admin-content-reset.use-case"
import {
  createAdminCourseUseCase,
  type AdminCourseUseCase,
} from "@workspace/core/modules/admin/application/use-cases/admin-course.use-case"
import {
  createAdminDashboardUseCase,
  type AdminDashboardUseCase,
} from "@workspace/core/modules/admin/application/use-cases/admin-dashboard.use-case"
import {
  createAdminResourceUseCase,
  type AdminResourceUseCase,
} from "@workspace/core/modules/admin/application/use-cases/admin-resource.use-case"
import {
  createAdminSettingsUseCase,
  type AdminSettingsUseCase,
} from "@workspace/core/modules/admin/application/use-cases/admin-settings.use-case"
import {
  createAdminUserUseCase,
  type AdminUserUseCase,
} from "@workspace/core/modules/admin/application/use-cases/admin-user.use-case"

export type AdminService = AdminAnalyticsUseCase &
  AdminAiChatUseCase &
  AdminContentResetUseCase &
  AdminCourseUseCase &
  AdminDashboardUseCase &
  AdminResourceUseCase &
  AdminSettingsUseCase &
  AdminUserUseCase

export type AdminServicePorts = {
  readonly aiChatRepository: AiChatAdminRepository
  readonly analyticsReader: AnalyticsReader
  readonly contentResetRepository: ContentResetRepository
  readonly courseRepository: CourseAdminRepository
  readonly dashboardReader: DashboardReader
  readonly resourceRepository: ResourceAdminRepository
  readonly settingsRepository: SettingsRepository
  readonly userRepository: UserAdminRepository
}

export function createAdminService(ports: AdminServicePorts): AdminService {
  return {
    ...createAdminAiChatUseCase(ports.aiChatRepository),
    ...createAdminAnalyticsUseCase(ports.analyticsReader),
    ...createAdminContentResetUseCase(ports.contentResetRepository),
    ...createAdminCourseUseCase(ports.courseRepository),
    ...createAdminDashboardUseCase(ports.dashboardReader),
    ...createAdminResourceUseCase(ports.resourceRepository),
    ...createAdminSettingsUseCase(ports.settingsRepository),
    ...createAdminUserUseCase(ports.userRepository),
  }
}
