import type {
  AdminAnalyticsDto,
  AdminAiChatConversationDetailDto,
  AdminAiChatConversationListDto,
  AdminAiChatMessageDto,
  AdminArchiveCourseResultDto,
  AdminContentResetResultDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
  AdminCourseListStatusFilter,
  AdminDashboardDto,
  AdminDeleteUserResultDto,
  AdminLegalSettingsRequest,
  AdminLessonAnalyticsPageDto,
  AdminLessonAnalyticsSort,
  AdminNoticeSettingsRequest,
  AdminArchiveResourceDocumentResultDto,
  AdminDeleteResourceDocumentResultDto,
  AdminResourceDocumentDetailDto,
  AdminResourceDocumentListDto,
  AdminResourceDocumentRequest,
  AdminResourceDocumentStatusFilter,
  AdminSettingsDto,
  AdminSortDirection,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserListStatusFilter,
  AdminUserSort,
  AdminUpdateUserStatusRequest,
} from "@workspace/core/modules/admin/domain/admin.dto"

export type ReadAdminDashboardInput = {
  readonly now: Date
}

export type ReadAdminAnalyticsInput = {
  readonly days: number
  readonly now: Date
}

export type ReadAdminLessonAnalyticsInput = {
  readonly direction: AdminSortDirection
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminLessonAnalyticsSort
}

export type SaveAdminNoticeSettingsInput = AdminNoticeSettingsRequest & {
  readonly now: Date
}

export type SaveAdminLegalSettingsInput = AdminLegalSettingsRequest & {
  readonly now: Date
}

export type ResetAdminContentInput = {
  readonly now: Date
}

export type CreateAdminCourseInput = {
  readonly now: Date
}

export type ReadAdminCoursesInput = {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: AdminCourseListStatusFilter
}

export type ReadAdminCourseInput = {
  readonly courseId: string
}

export type ArchiveAdminCourseInput = {
  readonly courseId: string
  readonly now: Date
}

export type ReadAdminUsersInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminUserSort
  readonly status: AdminUserListStatusFilter
}

export type ReadAdminUserInput = {
  readonly userId: string
}

export type UpdateAdminUserStatusInput = {
  readonly now: Date
  readonly status: AdminUpdateUserStatusRequest["status"]
  readonly userId: string
}

export type DeleteAdminUserInput = {
  readonly now: Date
  readonly userId: string
}

export type ReadAdminResourceDocumentsInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: AdminResourceDocumentStatusFilter
}

export type ReadAdminResourceDocumentInput = {
  readonly documentId: string
}

export type CreateAdminResourceDocumentInput = AdminResourceDocumentRequest & {
  readonly adminId: string
  readonly now: Date
}

export type UpdateAdminResourceDocumentInput = AdminResourceDocumentRequest & {
  readonly documentId: string
  readonly now: Date
}

export type ArchiveAdminResourceDocumentInput = {
  readonly adminId: string
  readonly documentId: string
  readonly now: Date
}

export type DeleteAdminResourceDocumentInput = {
  readonly adminId: string
  readonly documentId: string
}

export type ReadAdminAiChatConversationsInput = {
  readonly adminId: string
}

export type ReadAdminAiChatConversationInput = {
  readonly adminId: string
  readonly conversationId: string
}

export type CreateAdminAiChatUserMessageInput = {
  readonly adminId: string
  readonly conversationId: string | null
  readonly message: string
  readonly now: Date
}

export type SaveAdminAiChatAssistantMessageInput = {
  readonly content: string
  readonly conversationId: string
  readonly now: Date
}

export type AdminOwnerMutationResult<TValue> =
  | {
      readonly kind: "forbidden"
    }
  | {
      readonly kind: "not-found"
    }
  | {
      readonly kind: "ok"
      readonly value: TValue
    }

export type DashboardReader = {
  readonly readDashboard: (
    input: ReadAdminDashboardInput
  ) => Promise<AdminDashboardDto>
}

export type AnalyticsReader = {
  readonly readAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminAnalyticsDto>
  readonly readLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<AdminLessonAnalyticsPageDto>
}

export type CourseAdminRepository = {
  readonly archiveCourse: (
    input: ArchiveAdminCourseInput
  ) => Promise<AdminArchiveCourseResultDto | null>
  readonly createCourse: (
    input: CreateAdminCourseInput
  ) => Promise<AdminCourseDetailDto>
  readonly readCourseEditor: (
    input: ReadAdminCourseInput
  ) => Promise<AdminCourseDetailDto | null>
  readonly readCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminCourseListDto>
}

export type UserAdminRepository = {
  readonly deleteUser: (
    input: DeleteAdminUserInput
  ) => Promise<AdminDeleteUserResultDto | null>
  readonly readUser: (
    input: ReadAdminUserInput
  ) => Promise<AdminUserDetailDto | null>
  readonly readUsers: (input: ReadAdminUsersInput) => Promise<AdminUserListDto>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminUserDetailDto | null>
}

export type SettingsRepository = {
  readonly readSettings: () => Promise<AdminSettingsDto>
  readonly saveLegalSettings: (
    input: SaveAdminLegalSettingsInput
  ) => Promise<AdminSettingsDto>
  readonly saveNoticeSettings: (
    input: SaveAdminNoticeSettingsInput
  ) => Promise<AdminSettingsDto>
}

export type ContentResetRepository = {
  readonly resetContent: (
    input: ResetAdminContentInput
  ) => Promise<AdminContentResetResultDto>
}

export type ResourceAdminRepository = {
  readonly archiveResourceDocument: (
    input: ArchiveAdminResourceDocumentInput
  ) => Promise<AdminOwnerMutationResult<AdminArchiveResourceDocumentResultDto>>
  readonly createResourceDocument: (
    input: CreateAdminResourceDocumentInput
  ) => Promise<AdminResourceDocumentDetailDto>
  readonly deleteResourceDocument: (
    input: DeleteAdminResourceDocumentInput
  ) => Promise<AdminOwnerMutationResult<AdminDeleteResourceDocumentResultDto>>
  readonly readResourceDocument: (
    input: ReadAdminResourceDocumentInput
  ) => Promise<AdminResourceDocumentDetailDto | null>
  readonly readResourceDocuments: (
    input: ReadAdminResourceDocumentsInput
  ) => Promise<AdminResourceDocumentListDto>
  readonly updateResourceDocument: (
    input: UpdateAdminResourceDocumentInput
  ) => Promise<AdminResourceDocumentDetailDto | null>
}

export type AiChatAdminRepository = {
  readonly createAiChatUserMessage: (
    input: CreateAdminAiChatUserMessageInput
  ) => Promise<AdminAiChatConversationDetailDto | null>
  readonly readAiChatConversation: (
    input: ReadAdminAiChatConversationInput
  ) => Promise<AdminAiChatConversationDetailDto | null>
  readonly readAiChatConversations: (
    input: ReadAdminAiChatConversationsInput
  ) => Promise<AdminAiChatConversationListDto>
  readonly saveAiChatAssistantMessage: (
    input: SaveAdminAiChatAssistantMessageInput
  ) => Promise<AdminAiChatMessageDto>
}

export type AdminRepository = DashboardReader &
  AnalyticsReader &
  AiChatAdminRepository &
  CourseAdminRepository &
  UserAdminRepository &
  SettingsRepository &
  ContentResetRepository &
  ResourceAdminRepository
