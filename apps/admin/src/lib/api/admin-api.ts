import type { AdminApiResult } from "@/lib/api/api-result"

export type AdminCourseStatus = "active" | "archived"
export type AdminCourseStatusFilter = "all" | AdminCourseStatus
export type AdminLessonAnalyticsSort =
  | "completionRate"
  | "course"
  | "dropOff"
  | "lesson"
export type AdminSortDirection = "asc" | "desc"
export type AdminUserOperationalStatus = "active" | "suspended"
export type AdminUserSort = "joined" | "lastActive" | "lessonsDone" | "streak"
export type AdminUserStatus = AdminUserOperationalStatus | "deleted"
export type AdminUserListStatusFilter = "all" | AdminUserStatus
export type AdminAiChatMessageRole = "assistant" | "user"
export type AdminRole = "operator" | "owner"

export type AdminSession = {
  readonly admin: {
    readonly email: string
    readonly id: string
    readonly name: string
    readonly role: AdminRole
  }
  readonly mfa: {
    readonly enrollmentRequired: boolean
    readonly stepUpRequired: boolean
  }
}

export type AdminPagination = {
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}

export type AdminDashboard = {
  readonly metrics: {
    readonly activeCourses: number
    readonly activeLessons: number
    readonly activeUsersLast7Days: number
    readonly completedLessons: number
    readonly signupsLast7Days: number
    readonly signupsToday: number
    readonly totalUsers: number
  }
  readonly recentActivities: readonly {
    readonly currentStreakDays: number
    readonly email: string
    readonly lastActiveDate: string | null
    readonly name: string
    readonly userId: string
  }[]
}

export type AdminUserListItem = {
  readonly email: string
  readonly id: string
  readonly joined: string
  readonly lastActive: string | null
  readonly lessonsDone: number
  readonly name: string
  readonly status: AdminUserStatus
  readonly streak: number
}

export type AdminUserList = {
  readonly items: readonly AdminUserListItem[]
  readonly pagination: AdminPagination
}

export type AdminUserDetail = AdminUserListItem & {
  readonly progressPercent: number
  readonly totalLessons: number
}

export type AdminDeleteUserResult = {
  readonly deleted: true
}

export type AdminLessonAnalyticsItem = {
  readonly completed: number
  readonly completionRate: number
  readonly courseId: string
  readonly courseTitle: string
  readonly dropOffRate: number
  readonly lessonId: string
  readonly lessonTitle: string
  readonly started: number
}

export type AdminAnalytics = {
  readonly dailySeries: readonly {
    readonly completions: number
    readonly date: string
    readonly signups: number
  }[]
  readonly streakBuckets: readonly {
    readonly count: number
    readonly label: string
  }[]
  readonly worstLessons: readonly AdminLessonAnalyticsItem[]
}

export type AdminLessonAnalyticsPage = {
  readonly items: readonly AdminLessonAnalyticsItem[]
  readonly pagination: AdminPagination
}

export type AdminNoticeSettingsRequest = {
  readonly announce: string
  readonly banner: string
}

export type AdminLegalSettingsRequest = {
  readonly privacy: string
  readonly terms: string
}

export type AdminSettings = {
  readonly legal: AdminLegalSettingsRequest
  readonly notice: AdminNoticeSettingsRequest
}

export type AdminContentResetResult = {
  readonly changed: {
    readonly archived: number
    readonly courses: number
    readonly lessons: number
    readonly steps: number
    readonly units: number
  }
  readonly revision: number
}

export type AdminCourseStep = {
  readonly contentJson: string
  readonly id: string
  readonly sortOrder: number
  readonly status: AdminCourseStatus
  readonly type: string
}

export type AdminCourseLesson = {
  readonly category: string | null
  readonly description: string | null
  readonly estimatedMinutes: number
  readonly id: string
  readonly sortOrder: number
  readonly status: AdminCourseStatus
  readonly summary: readonly string[]
  readonly steps: readonly AdminCourseStep[]
  readonly title: string
}

export type AdminCourseUnit = {
  readonly id: string
  readonly lessons: readonly AdminCourseLesson[]
  readonly sortOrder: number
  readonly status: AdminCourseStatus
  readonly title: string
}

export type AdminCourseDetail = {
  readonly category: string
  readonly description: string
  readonly id: string
  readonly revision: number
  readonly status: AdminCourseStatus
  readonly title: string
  readonly units: readonly AdminCourseUnit[]
}

export type AdminArchiveCourseResult = {
  readonly archived: true
}

export type AdminAiChatMessage = {
  readonly content: string
  readonly createdAt: string
  readonly id: string
  readonly role: AdminAiChatMessageRole
}

export type AdminAiChatConversation = {
  readonly createdAt: string
  readonly id: string
  readonly messageCount: number
  readonly title: string
  readonly updatedAt: string
}

export type AdminAiChatConversationList = {
  readonly items: readonly AdminAiChatConversation[]
}

export type AdminAiChatConversationDetail = {
  readonly conversation: AdminAiChatConversation
  readonly messages: readonly AdminAiChatMessage[]
}

export type AdminCourseListItem = {
  readonly category: string
  readonly id: string
  readonly lessonCount: number
  readonly revision: number
  readonly status: AdminCourseStatus
  readonly title: string
  readonly unitCount: number
  readonly visualKey:
    | "basic-sentence-writing"
    | "creative-writing"
    | "essay-writing"
    | "expression"
    | "grammar-complete"
}

export type AdminCourseList = {
  readonly items: readonly AdminCourseListItem[]
  readonly pagination: AdminPagination
}

export type AdminResourceTreeScope = "active" | "trash"

export type AdminResourceBreadcrumbItem = {
  readonly id: string
  readonly name: string
}

export type AdminResourceActor = {
  readonly email: string
  readonly id: string
  readonly name: string
}

type AdminResourceTreeNodeBase = {
  readonly id: string
  readonly name: string
  readonly parentId: string | null
  readonly sortOrder: number
  readonly status: "active" | "archived"
}

export type AdminResourceTreeNode =
  | (AdminResourceTreeNodeBase & {
      readonly hasChildren: boolean
      readonly kind: "folder"
    })
  | (AdminResourceTreeNodeBase & {
      readonly hasChildren: false
      readonly kind: "document"
    })

export type AdminResourceTree = {
  readonly nodes: readonly AdminResourceTreeNode[]
  readonly revision: number
}

export type AdminResourceActiveEditorCount = {
  readonly activeEditorCount: number
}

export type AdminResourceTreeMutationAction =
  | "create-document"
  | "create-folder"
  | "import-document"
  | "move"
  | "rename"
  | "restore"
  | "trash"

export type AdminResourceEvent =
  | {
      readonly action: AdminResourceTreeMutationAction
      readonly affectedParentIds: readonly (string | null)[]
      readonly nodeId: string
      readonly revision: number
      readonly type: "resource-tree-mutated"
    }
  | {
      readonly documentId: string
      readonly name: string
      readonly revision: number
      readonly type: "resource-document-title-confirmed"
    }

export type AdminResourceDocumentRealtimeEvent =
  | {
      readonly documentId: string
      readonly stateVersion: number
      readonly type: "resource-document-subscription-confirmed"
    }
  | {
      readonly contentRevision: number
      readonly documentId: string
      readonly stateVersion: number
      readonly type: "resource-document-version-advanced"
    }
  | {
      readonly documentId: string
      readonly reason: "archived" | "projection-failed"
      readonly type: "resource-document-invalidated"
    }

export type AdminResourceRealtimeMessage =
  | AdminResourceDocumentRealtimeEvent
  | AdminResourceEvent

export type AdminResourceNodeMutation = {
  readonly affectedParentIds: readonly (string | null)[]
  readonly node: AdminResourceTreeNode
  readonly revision: number
}

type AdminResourceSubtreeMutation = {
  readonly affectedParentIds: readonly (string | null)[]
  readonly documentCount: number
  readonly folderCount: number
  readonly revision: number
}

export type AdminResourceTrashResult = AdminResourceSubtreeMutation

export type AdminResourceRestoreResult = AdminResourceSubtreeMutation & {
  readonly node: AdminResourceTreeNode
}

type AdminResourceLibraryDocumentMetadata = {
  readonly contentRevision: number
  readonly createdAt: string
  readonly createdBy: AdminResourceActor
  readonly id: string
  readonly name: string
  readonly parentId: string | null
  readonly path: readonly AdminResourceBreadcrumbItem[]
  readonly stateVersion: number
  readonly updatedAt: string
  readonly updatedBy: AdminResourceActor
}

export type AdminResourceActiveDocument =
  AdminResourceLibraryDocumentMetadata & {
    readonly status: "active"
  }

export type AdminResourceArchivedDocument =
  AdminResourceLibraryDocumentMetadata & {
    readonly contentMarkdown: string
    readonly status: "archived"
  }

export type AdminResourceLibraryDocument =
  | AdminResourceActiveDocument
  | AdminResourceArchivedDocument

export type AdminResourceDocumentTransactionInput = {
  readonly knownStateVersion: number
  readonly transactionId: string
  readonly update: Uint8Array
}

export type AdminResourceDocumentTransactionResult = {
  readonly contentRevision: number
  readonly kind: "accepted" | "already-accepted"
  readonly stateVersion: number
  readonly transactionId: string
}

export type AdminResourceDocumentSync =
  | { readonly kind: "up-to-date"; readonly stateVersion: number }
  | {
      readonly fromStateVersion: number
      readonly kind: "updates"
      readonly stateVersion: number
      readonly updates: readonly Uint8Array[]
    }
  | {
      readonly kind: "snapshot"
      readonly snapshot: Uint8Array
      readonly stateVersion: number
    }

export type AdminImportResourceDocumentInput = {
  readonly expectedRevision: number
  readonly fileName: string
  readonly markdown: string
  readonly parentId: string | null
}

export type AdminImportResourceDocumentResult = {
  readonly document: AdminResourceActiveDocument
  readonly mutation: AdminResourceNodeMutation
}

export type AdminExportResourceDocument = {
  readonly fileName: string
  readonly markdown: string
}

export type AdminResourceSearchItem = {
  readonly excerpt: string | null
  readonly id: string
  readonly kind: "document" | "folder"
  readonly name: string
  readonly path: readonly AdminResourceBreadcrumbItem[]
}

export type AdminResourceSearch = {
  readonly items: readonly AdminResourceSearchItem[]
}

export type AdminResourceParentCommandInput = {
  readonly expectedRevision: number
  readonly parentId: string | null
}

export type AdminResourceRevisionCommandInput = {
  readonly expectedRevision: number
}

export type AdminMoveResourceNodeInput = AdminResourceRevisionCommandInput & {
  readonly destinationIndex: number
  readonly destinationParentId: string | null
}

export type AdminRenameResourceNodeInput = AdminResourceRevisionCommandInput & {
  readonly name: string
}

export type ReadAdminCoursesInput = {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: AdminCourseStatusFilter
}

export type ReadAdminUsersInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminUserSort
  readonly status: AdminUserListStatusFilter
}

export type ReadAdminAnalyticsInput = {
  readonly days: number
}

export type ReadAdminLessonAnalyticsInput = {
  readonly direction: AdminSortDirection
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminLessonAnalyticsSort
}

export type UpdateAdminUserStatusInput = {
  readonly status: AdminUserOperationalStatus
  readonly userId: string
}

export type AdminApi = {
  readonly archiveCourse: (
    courseId: string
  ) => Promise<AdminApiResult<AdminArchiveCourseResult>>
  readonly createResourceDocumentNode: (
    input: AdminResourceParentCommandInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly createResourceFolder: (
    input: AdminResourceParentCommandInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly createCourse: () => Promise<AdminApiResult<AdminCourseDetail>>
  readonly deleteUser: (
    userId: string
  ) => Promise<AdminApiResult<AdminDeleteUserResult>>
  readonly getAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminApiResult<AdminAnalytics>>
  readonly getAiChatConversation: (
    conversationId: string
  ) => Promise<AdminApiResult<AdminAiChatConversationDetail>>
  readonly getAiChatConversations: () => Promise<
    AdminApiResult<AdminAiChatConversationList>
  >
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminApiResult<AdminCourseList>>
  readonly getCourseEditor: (
    courseId: string
  ) => Promise<AdminApiResult<AdminCourseDetail>>
  readonly getDashboard: () => Promise<AdminApiResult<AdminDashboard>>
  readonly getLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<AdminApiResult<AdminLessonAnalyticsPage>>
  readonly getResourceLibraryDocument: (
    documentId: string
  ) => Promise<AdminApiResult<AdminResourceLibraryDocument>>
  readonly getResourceDocumentSync: (
    documentId: string,
    afterStateVersion: number
  ) => Promise<AdminApiResult<AdminResourceDocumentSync>>
  readonly getResourceDocumentSnapshot: (
    documentId: string
  ) => Promise<AdminApiResult<AdminResourceDocumentSync>>
  readonly getResourceActiveEditorCount: (
    nodeId: string
  ) => Promise<AdminApiResult<AdminResourceActiveEditorCount>>
  readonly getResourceTree: (input: {
    readonly parentId: string | null
    readonly scope: AdminResourceTreeScope
  }) => Promise<AdminApiResult<AdminResourceTree>>
  readonly getSettings: () => Promise<AdminApiResult<AdminSettings>>
  readonly getSession: () => Promise<AdminApiResult<AdminSession>>
  readonly getUser: (userId: string) => Promise<AdminApiResult<AdminUserDetail>>
  readonly getUsers: (
    input: ReadAdminUsersInput
  ) => Promise<AdminApiResult<AdminUserList>>
  readonly resetContent: () => Promise<AdminApiResult<AdminContentResetResult>>
  readonly exportResourceDocument: (
    documentId: string
  ) => Promise<AdminApiResult<AdminExportResourceDocument>>
  readonly importResourceDocument: (
    input: AdminImportResourceDocumentInput
  ) => Promise<AdminApiResult<AdminImportResourceDocumentResult>>
  readonly moveResourceNode: (
    nodeId: string,
    input: AdminMoveResourceNodeInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly renameResourceNode: (
    nodeId: string,
    input: AdminRenameResourceNodeInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly restoreResourceNode: (
    nodeId: string,
    input: AdminResourceRevisionCommandInput
  ) => Promise<AdminApiResult<AdminResourceRestoreResult>>
  readonly saveLegalSettings: (
    input: AdminLegalSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly saveNoticeSettings: (
    input: AdminNoticeSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly saveResourceDocumentTransaction: (
    documentId: string,
    input: AdminResourceDocumentTransactionInput
  ) => Promise<AdminApiResult<AdminResourceDocumentTransactionResult>>
  readonly searchResources: (input: {
    readonly limit: number
    readonly query: string
    readonly scope: AdminResourceTreeScope
  }) => Promise<AdminApiResult<AdminResourceSearch>>
  readonly trashResourceNode: (
    nodeId: string,
    input: AdminResourceRevisionCommandInput
  ) => Promise<AdminApiResult<AdminResourceTrashResult>>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminApiResult<AdminUserDetail>>
}
