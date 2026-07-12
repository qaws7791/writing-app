import type {
  AnalyticsReader,
  AiChatAdminRepository,
  ContentResetRepository,
  CourseAdminRepository,
  DashboardReader,
  SettingsRepository,
  UserAdminRepository,
} from "#core/modules/admin/application/ports/admin.repository"
import {
  createAdminAnalyticsUseCase,
  type AdminAnalyticsUseCase,
} from "#core/modules/admin/application/use-cases/admin-analytics.use-case"
import {
  createAdminAiChatUseCase,
  type AdminAiChatUseCase,
} from "#core/modules/admin/application/use-cases/admin-ai-chat.use-case"
import {
  createAdminContentResetUseCase,
  type AdminContentResetUseCase,
} from "#core/modules/admin/application/use-cases/admin-content-reset.use-case"
import {
  createAdminCourseUseCase,
  type AdminCourseUseCase,
} from "#core/modules/admin/application/use-cases/admin-course.use-case"
import {
  createAdminDashboardUseCase,
  type AdminDashboardUseCase,
} from "#core/modules/admin/application/use-cases/admin-dashboard.use-case"
import {
  createAdminSettingsUseCase,
  type AdminSettingsUseCase,
} from "#core/modules/admin/application/use-cases/admin-settings.use-case"
import {
  createAdminUserUseCase,
  type AdminUserUseCase,
} from "#core/modules/admin/application/use-cases/admin-user.use-case"

export type AdminService = AdminAnalyticsUseCase &
  AdminAiChatUseCase &
  AdminContentResetUseCase &
  AdminCourseUseCase &
  AdminDashboardUseCase &
  AdminSettingsUseCase &
  AdminUserUseCase

export type AdminServicePorts = {
  readonly aiChatRepository: AiChatAdminRepository
  readonly analyticsReader: AnalyticsReader
  readonly contentResetRepository: ContentResetRepository
  readonly courseRepository: CourseAdminRepository
  readonly dashboardReader: DashboardReader
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
    ...createAdminSettingsUseCase(ports.settingsRepository),
    ...createAdminUserUseCase(ports.userRepository),
  }
}
