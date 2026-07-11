import {
  contractAdminApiError,
  networkAdminApiError,
  toAdminApiError,
} from "@/lib/api/api-error"
import {
  adminApiError,
  adminApiOk,
  type AdminApiResult,
} from "@/lib/api/api-result"
import { adminSessionCookieName } from "@/lib/auth/admin-session-token"
import { buildAdminApiUrl, type AdminApiBaseUrl } from "@/runtime-config"
import type {
  AdminAnalytics,
  AdminApi,
  AdminAiChatConversation,
  AdminAiChatConversationDetail,
  AdminAiChatConversationList,
  AdminAiChatMessage,
  AdminArchiveCourseResult,
  AdminContentResetResult,
  AdminCourseDetail,
  AdminCourseLesson,
  AdminCourseList,
  AdminCourseListItem,
  AdminCourseStep,
  AdminCourseUnit,
  AdminDashboard,
  AdminDeleteUserResult,
  AdminLessonAnalyticsItem,
  AdminLessonAnalyticsPage,
  AdminExportResourceDocument,
  AdminImportResourceDocumentResult,
  AdminPagination,
  AdminResourceActiveEditorCount,
  AdminResourceDocumentSync,
  AdminResourceDocumentTransactionResult,
  AdminResourceEvent,
  AdminResourceLibraryDocument,
  AdminResourceNodeMutation,
  AdminResourceRealtimeMessage,
  AdminResourceRestoreResult,
  AdminResourceSearch,
  AdminResourceTrashResult,
  AdminResourceTree,
  AdminResourceTreeNode,
  AdminSession,
  AdminSettings,
  AdminUserDetail,
  AdminUserList,
  AdminUserListItem,
  ReadAdminAnalyticsInput,
  ReadAdminCoursesInput,
  ReadAdminLessonAnalyticsInput,
  ReadAdminUsersInput,
  UpdateAdminUserStatusInput,
} from "@/lib/api/admin-api"
import type {
  AdminAnalyticsDto,
  AdminAiChatConversationDetailDto,
  AdminAiChatConversationDto,
  AdminAiChatConversationListDto,
  AdminArchiveCourseResultDto,
  AdminContentResetResultDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
  AdminDashboardDto,
  AdminDeleteUserResultDto,
  AdminLessonAnalyticsPageDto,
  AdminImportResourceDocumentResultDto,
  AdminResourceActiveEditorCountDto,
  AdminReadResourceDocumentSyncResponse,
  AdminSaveResourceDocumentTransactionResponse,
  AdminResourceDocumentDto,
  AdminResourceNodeMutationDto,
  AdminResourceRestoreResultDto,
  AdminResourceSearchDto,
  AdminResourceTrashResultDto,
  AdminResourceTrashMutationDto,
  AdminResourceTreeDto,
  AdminResourceTreeNodeDto,
  AdminSessionDto,
  AdminSettingsDto,
  AdminUserDetailDto,
  AdminUserListDto,
} from "@workspace/contracts/admin"
import {
  adminAnalyticsDtoSchema,
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  adminArchiveCourseResultSchema,
  adminContentResetResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
  adminDashboardDtoSchema,
  adminDeleteUserResultSchema,
  adminLessonAnalyticsPageDtoSchema,
  adminImportResourceDocumentResultDtoSchema,
  adminResourceActiveEditorCountDtoSchema,
  adminReadResourceDocumentSyncResponseSchema,
  adminResourceDocumentDtoSchema,
  adminResourceEventSchema,
  adminResourceRealtimeServerMessageSchema,
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceSearchDtoSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
  adminSaveResourceDocumentTransactionResponseSchema,
  adminSessionDtoSchema,
  adminSettingsDtoSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
} from "@workspace/contracts/admin"
import { fetchHttpResponse, type HttpFetch } from "@workspace/http-client"

type ResponseSchema<TValue> = {
  readonly safeParse: (value: unknown) =>
    | {
        readonly data: TValue
        readonly success: true
      }
    | {
        readonly success: false
      }
}

export function parseAdminResourceEvent(
  value: unknown
): AdminResourceEvent | null {
  const result = adminResourceEventSchema.safeParse(value)

  if (!result.success) return null

  return result.data.type === "resource-tree-mutated"
    ? {
        action: result.data.action,
        affectedParentIds: [...result.data.affectedParentIds],
        nodeId: result.data.nodeId,
        revision: result.data.revision,
        type: "resource-tree-mutated",
      }
    : {
        documentId: result.data.documentId,
        name: result.data.name,
        revision: result.data.revision,
        type: "resource-document-title-confirmed",
      }
}

export function parseAdminResourceRealtimeMessage(
  value: unknown
): AdminResourceRealtimeMessage | null {
  const result = adminResourceRealtimeServerMessageSchema.safeParse(value)

  if (!result.success) return null

  const resourceEvent = parseAdminResourceEvent(result.data)
  if (resourceEvent !== null) return resourceEvent

  switch (result.data.type) {
    case "resource-document-subscription-confirmed":
      return {
        documentId: result.data.documentId,
        stateVersion: result.data.stateVersion,
        type: result.data.type,
      }
    case "resource-document-version-advanced":
      return {
        contentRevision: result.data.contentRevision,
        documentId: result.data.documentId,
        stateVersion: result.data.stateVersion,
        type: result.data.type,
      }
    case "resource-document-invalidated":
      return {
        documentId: result.data.documentId,
        reason: result.data.reason,
        type: result.data.type,
      }
    default:
      return null
  }
}

export type AdminFetchLike = HttpFetch
export type AdminTokenProvider = () => Promise<string | null> | string | null
type AdminHttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT"
type AdminHttpClient = {
  readonly requestMarkdown: (input: {
    readonly path: string
  }) => Promise<AdminApiResult<AdminExportResourceDocument>>
  readonly requestJson: <TValue>(input: {
    readonly body?: unknown
    readonly method: AdminHttpMethod
    readonly path: string
    readonly schema: ResponseSchema<TValue>
  }) => Promise<AdminApiResult<TValue>>
}

export function createHttpAdminApi({
  baseUrl,
  fetch,
  requestOrigin,
  tokenProvider,
}: {
  readonly baseUrl: AdminApiBaseUrl
  readonly fetch: AdminFetchLike
  readonly requestOrigin?: string
  readonly tokenProvider: AdminTokenProvider
}): AdminApi {
  const client = createAdminHttpClient({
    baseUrl,
    fetch,
    requestOrigin,
    tokenProvider,
  })

  return {
    archiveCourse(courseId) {
      return requestAdminJson(client, {
        method: "DELETE",
        path: `/courses/${courseId}`,
        schema: adminArchiveCourseResultSchema,
        toModel: toAdminArchiveCourseResult,
      })
    },
    createCourse() {
      return requestAdminJson(client, {
        method: "POST",
        path: "/courses",
        schema: adminCourseDetailDtoSchema,
        toModel: toAdminCourseDetail,
      })
    },
    createResourceDocumentNode(input) {
      return requestAdminJson(client, {
        body: input,
        method: "POST",
        path: "/resources/documents",
        schema: adminResourceNodeMutationDtoSchema,
        toModel: toAdminResourceNodeMutation,
      })
    },
    createResourceFolder(input) {
      return requestAdminJson(client, {
        body: input,
        method: "POST",
        path: "/resources/folders",
        schema: adminResourceNodeMutationDtoSchema,
        toModel: toAdminResourceNodeMutation,
      })
    },
    deleteUser(userId) {
      return requestAdminJson(client, {
        method: "DELETE",
        path: `/users/${userId}`,
        schema: adminDeleteUserResultSchema,
        toModel: toAdminDeleteUserResult,
      })
    },
    getAnalytics(input) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/analytics?${analyticsSearchParams(input)}`,
        schema: adminAnalyticsDtoSchema,
        toModel: toAdminAnalytics,
      })
    },
    getAiChatConversation(conversationId) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/ai-chat/conversations/${conversationId}`,
        schema: adminAiChatConversationDetailDtoSchema,
        toModel: toAdminAiChatConversationDetail,
      })
    },
    getAiChatConversations() {
      return requestAdminJson(client, {
        method: "GET",
        path: "/ai-chat/conversations",
        schema: adminAiChatConversationListDtoSchema,
        toModel: toAdminAiChatConversationList,
      })
    },
    getCourses(input) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/courses?${coursesSearchParams(input)}`,
        schema: adminCourseListDtoSchema,
        toModel: toAdminCourseList,
      })
    },
    getCourseEditor(courseId) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/courses/${courseId}/editor`,
        schema: adminCourseDetailDtoSchema,
        toModel: toAdminCourseDetail,
      })
    },
    getDashboard() {
      return requestAdminJson(client, {
        method: "GET",
        path: "/dashboard",
        schema: adminDashboardDtoSchema,
        toModel: toAdminDashboard,
      })
    },
    getLessonAnalytics(input) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/analytics/lessons?${lessonAnalyticsSearchParams(input)}`,
        schema: adminLessonAnalyticsPageDtoSchema,
        toModel: toAdminLessonAnalyticsPage,
      })
    },
    getResourceLibraryDocument(documentId) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/resources/documents/${documentId}`,
        schema: adminResourceDocumentDtoSchema,
        toModel: toAdminResourceLibraryDocument,
      })
    },
    getResourceDocumentSync(documentId, afterStateVersion) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/resources/documents/${documentId}/sync?afterStateVersion=${afterStateVersion}`,
        schema: adminReadResourceDocumentSyncResponseSchema,
        toModel: toAdminResourceDocumentSync,
      })
    },
    getResourceActiveEditorCount(nodeId) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/resources/nodes/${nodeId}/active-editors`,
        schema: adminResourceActiveEditorCountDtoSchema,
        toModel: toAdminResourceActiveEditorCount,
      })
    },
    getResourceTree(input) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/resources/tree?${resourceTreeSearchParams(input)}`,
        schema: adminResourceTreeDtoSchema,
        toModel: toAdminResourceTree,
      })
    },
    getSettings() {
      return requestAdminJson(client, {
        method: "GET",
        path: "/settings",
        schema: adminSettingsDtoSchema,
        toModel: toAdminSettings,
      })
    },
    getSession() {
      return requestAdminJson(client, {
        method: "GET",
        path: "/session",
        schema: adminSessionDtoSchema,
        toModel: toAdminSession,
      })
    },
    getUser(userId) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/users/${userId}`,
        schema: adminUserDetailDtoSchema,
        toModel: toAdminUserDetail,
      })
    },
    getUsers(input) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/users?${usersSearchParams(input)}`,
        schema: adminUserListDtoSchema,
        toModel: toAdminUserList,
      })
    },
    resetContent() {
      return requestAdminJson(client, {
        body: {},
        method: "POST",
        path: "/settings/content-reset",
        schema: adminContentResetResultSchema,
        toModel: toAdminContentResetResult,
      })
    },
    exportResourceDocument(documentId) {
      return client.requestMarkdown({
        path: `/resources/documents/${documentId}/export`,
      })
    },
    importResourceDocument(input) {
      return requestAdminJson(client, {
        body: input,
        method: "POST",
        path: "/resources/documents/import",
        schema: adminImportResourceDocumentResultDtoSchema,
        toModel: toAdminImportResourceDocumentResult,
      })
    },
    moveResourceNode(nodeId, input) {
      return requestAdminJson(client, {
        body: input,
        method: "PATCH",
        path: `/resources/nodes/${nodeId}/move`,
        schema: adminResourceNodeMutationDtoSchema,
        toModel: toAdminResourceNodeMutation,
      })
    },
    renameResourceNode(nodeId, input) {
      return requestAdminJson(client, {
        body: input,
        method: "PATCH",
        path: `/resources/nodes/${nodeId}/name`,
        schema: adminResourceNodeMutationDtoSchema,
        toModel: toAdminResourceNodeMutation,
      })
    },
    restoreResourceNode(nodeId, input) {
      return requestAdminJson(client, {
        body: input,
        method: "POST",
        path: `/resources/nodes/${nodeId}/restore`,
        schema: adminResourceRestoreResultDtoSchema,
        toModel: toAdminResourceRestoreResult,
      })
    },
    saveLegalSettings(input) {
      return requestAdminJson(client, {
        body: input,
        method: "PUT",
        path: "/settings/legal",
        schema: adminSettingsDtoSchema,
        toModel: toAdminSettings,
      })
    },
    saveNoticeSettings(input) {
      return requestAdminJson(client, {
        body: input,
        method: "PUT",
        path: "/settings/notice",
        schema: adminSettingsDtoSchema,
        toModel: toAdminSettings,
      })
    },
    saveResourceDocumentTransaction(documentId, input) {
      return requestAdminJson(client, {
        body: {
          knownStateVersion: input.knownStateVersion,
          transactionId: input.transactionId,
          updateBase64: encodeBase64(input.update),
        },
        method: "POST",
        path: `/resources/documents/${documentId}/transactions`,
        schema: adminSaveResourceDocumentTransactionResponseSchema,
        toModel: toAdminResourceDocumentTransactionResult,
      })
    },
    searchResources(input) {
      return requestAdminJson(client, {
        method: "GET",
        path: `/resources/search?${resourceSearchParams(input)}`,
        schema: adminResourceSearchDtoSchema,
        toModel: toAdminResourceSearch,
      })
    },
    trashResourceNode(nodeId, input) {
      return requestAdminJson(client, {
        body: input,
        method: "POST",
        path: `/resources/nodes/${nodeId}/trash`,
        schema: adminResourceTrashResultDtoSchema,
        toModel: toAdminResourceTrashResult,
      })
    },
    updateUserStatus(input: UpdateAdminUserStatusInput) {
      return requestAdminJson(client, {
        body: {
          status: input.status,
        },
        method: "PATCH",
        path: `/users/${input.userId}/status`,
        schema: adminUserDetailDtoSchema,
        toModel: toAdminUserDetail,
      })
    },
  }
}

async function requestAdminJson<TWire, TModel>(
  client: AdminHttpClient,
  input: {
    readonly body?: unknown
    readonly method: AdminHttpMethod
    readonly path: string
    readonly schema: ResponseSchema<TWire>
    readonly toModel: (value: TWire) => TModel
  }
): Promise<AdminApiResult<TModel>> {
  const requestInput = {
    method: input.method,
    path: input.path,
    schema: input.schema,
  }
  const result = await client.requestJson(
    input.body === undefined
      ? requestInput
      : {
          ...requestInput,
          body: input.body,
        }
  )

  if (result.status === "error") {
    return result
  }

  return adminApiOk(input.toModel(result.value))
}

type AdminUserListItemDto = AdminUserListDto["items"][number]
type AdminAiChatMessageDto =
  AdminAiChatConversationDetailDto["messages"][number]
type AdminLessonAnalyticsItemDto = AdminAnalyticsDto["worstLessons"][number]
type AdminCourseListItemDto = AdminCourseListDto["items"][number]
type AdminCourseUnitDto = AdminCourseDetailDto["units"][number]
type AdminCourseLessonDto = AdminCourseUnitDto["lessons"][number]
type AdminCourseStepDto = AdminCourseLessonDto["steps"][number]

function toAdminDashboard(dto: AdminDashboardDto): AdminDashboard {
  return {
    metrics: {
      activeCourses: dto.metrics.activeCourses,
      activeLessons: dto.metrics.activeLessons,
      activeUsersLast7Days: dto.metrics.activeUsersLast7Days,
      completedLessons: dto.metrics.completedLessons,
      signupsLast7Days: dto.metrics.signupsLast7Days,
      signupsToday: dto.metrics.signupsToday,
      totalUsers: dto.metrics.totalUsers,
    },
    recentActivities: dto.recentActivities.map((activity) => ({
      currentStreakDays: activity.currentStreakDays,
      email: activity.email,
      lastActiveDate: activity.lastActiveDate,
      name: activity.name,
      userId: activity.userId,
    })),
  }
}

function toAdminSession(dto: AdminSessionDto): AdminSession {
  return {
    admin: {
      email: dto.admin.email,
      id: dto.admin.id,
      name: dto.admin.name,
      role: dto.admin.role,
    },
  }
}

function toAdminUserList(dto: AdminUserListDto): AdminUserList {
  return {
    items: dto.items.map(toAdminUserListItem),
    pagination: toAdminPagination(dto.pagination),
  }
}

function toAdminUserListItem(dto: AdminUserListItemDto): AdminUserListItem {
  return {
    email: dto.email,
    id: dto.id,
    joined: dto.joined,
    lastActive: dto.lastActive,
    lessonsDone: dto.lessonsDone,
    name: dto.name,
    status: dto.status,
    streak: dto.streak,
  }
}

function toAdminUserDetail(dto: AdminUserDetailDto): AdminUserDetail {
  return {
    ...toAdminUserListItem(dto),
    progressPercent: dto.progressPercent,
    totalLessons: dto.totalLessons,
  }
}

function toAdminAiChatConversationList(
  dto: AdminAiChatConversationListDto
): AdminAiChatConversationList {
  return {
    items: dto.items.map(toAdminAiChatConversation),
  }
}

function toAdminAiChatConversationDetail(
  dto: AdminAiChatConversationDetailDto
): AdminAiChatConversationDetail {
  return {
    conversation: toAdminAiChatConversation(dto.conversation),
    messages: dto.messages.map(toAdminAiChatMessage),
  }
}

function toAdminAiChatConversation(
  dto: AdminAiChatConversationDto
): AdminAiChatConversation {
  return {
    createdAt: dto.createdAt,
    id: dto.id,
    messageCount: dto.messageCount,
    title: dto.title,
    updatedAt: dto.updatedAt,
  }
}

function toAdminAiChatMessage(dto: AdminAiChatMessageDto): AdminAiChatMessage {
  return {
    content: dto.content,
    createdAt: dto.createdAt,
    id: dto.id,
    role: dto.role,
  }
}

function toAdminDeleteUserResult(
  dto: AdminDeleteUserResultDto
): AdminDeleteUserResult {
  return {
    deleted: dto.deleted,
  }
}

function toAdminAnalytics(dto: AdminAnalyticsDto): AdminAnalytics {
  return {
    dailySeries: dto.dailySeries.map((item) => ({
      completions: item.completions,
      date: item.date,
      signups: item.signups,
    })),
    streakBuckets: dto.streakBuckets.map((item) => ({
      count: item.count,
      label: item.label,
    })),
    worstLessons: dto.worstLessons.map(toAdminLessonAnalyticsItem),
  }
}

function toAdminLessonAnalyticsPage(
  dto: AdminLessonAnalyticsPageDto
): AdminLessonAnalyticsPage {
  return {
    items: dto.items.map(toAdminLessonAnalyticsItem),
    pagination: toAdminPagination(dto.pagination),
  }
}

function toAdminLessonAnalyticsItem(
  dto: AdminLessonAnalyticsItemDto
): AdminLessonAnalyticsItem {
  return {
    completed: dto.completed,
    completionRate: dto.completionRate,
    courseId: dto.courseId,
    courseTitle: dto.courseTitle,
    dropOffRate: dto.dropOffRate,
    lessonId: dto.lessonId,
    lessonTitle: dto.lessonTitle,
    started: dto.started,
  }
}

function toAdminSettings(dto: AdminSettingsDto): AdminSettings {
  return {
    legal: {
      privacy: dto.legal.privacy,
      terms: dto.legal.terms,
    },
    notice: {
      announce: dto.notice.announce,
      banner: dto.notice.banner,
    },
  }
}

function toAdminContentResetResult(
  dto: AdminContentResetResultDto
): AdminContentResetResult {
  return {
    changed: {
      archived: dto.changed.archived,
      courses: dto.changed.courses,
      lessons: dto.changed.lessons,
      steps: dto.changed.steps,
      units: dto.changed.units,
    },
    revision: dto.revision,
  }
}

function toAdminCourseDetail(dto: AdminCourseDetailDto): AdminCourseDetail {
  return {
    category: dto.category,
    description: dto.description,
    id: dto.id,
    revision: dto.revision,
    status: dto.status,
    title: dto.title,
    units: dto.units.map(toAdminCourseUnit),
  }
}

function toAdminCourseUnit(dto: AdminCourseUnitDto): AdminCourseUnit {
  return {
    id: dto.id,
    lessons: dto.lessons.map(toAdminCourseLesson),
    sortOrder: dto.sortOrder,
    status: dto.status,
    title: dto.title,
  }
}

function toAdminCourseLesson(dto: AdminCourseLessonDto): AdminCourseLesson {
  return {
    category: dto.category,
    description: dto.description,
    estimatedMinutes: dto.estimatedMinutes,
    id: dto.id,
    sortOrder: dto.sortOrder,
    status: dto.status,
    summary: [...dto.summary],
    steps: dto.steps.map(toAdminCourseStep),
    title: dto.title,
  }
}

function toAdminCourseStep(dto: AdminCourseStepDto): AdminCourseStep {
  return {
    contentJson: dto.contentJson,
    id: dto.id,
    sortOrder: dto.sortOrder,
    status: dto.status,
    type: dto.type,
  }
}

function toAdminCourseList(dto: AdminCourseListDto): AdminCourseList {
  return {
    items: dto.items.map(toAdminCourseListItem),
    pagination: toAdminPagination(dto.pagination),
  }
}

function toAdminCourseListItem(
  dto: AdminCourseListItemDto
): AdminCourseListItem {
  return {
    category: dto.category,
    id: dto.id,
    lessonCount: dto.lessonCount,
    revision: dto.revision,
    status: dto.status,
    title: dto.title,
    unitCount: dto.unitCount,
    visualKey: dto.visualKey,
  }
}

function toAdminResourceTree(dto: AdminResourceTreeDto): AdminResourceTree {
  return {
    nodes: dto.nodes.map(toAdminResourceTreeNode),
    revision: dto.revision,
  }
}

function toAdminResourceActiveEditorCount(
  dto: AdminResourceActiveEditorCountDto
): AdminResourceActiveEditorCount {
  return { activeEditorCount: dto.activeEditorCount }
}

function toAdminResourceTreeNode(
  dto: AdminResourceTreeNodeDto
): AdminResourceTreeNode {
  const node = {
    id: dto.id,
    name: dto.name,
    parentId: dto.parentId,
    sortOrder: dto.sortOrder,
    status: dto.status,
  }

  return dto.kind === "folder"
    ? {
        ...node,
        hasChildren: dto.hasChildren,
        kind: "folder",
      }
    : {
        ...node,
        hasChildren: false,
        kind: "document",
      }
}

function toAdminResourceNodeMutation(
  dto: AdminResourceNodeMutationDto
): AdminResourceNodeMutation {
  return {
    affectedParentIds: [...dto.affectedParentIds],
    node: toAdminResourceTreeNode(dto.node),
    revision: dto.revision,
  }
}

function toAdminResourceTrashResult(
  dto: AdminResourceTrashResultDto
): AdminResourceTrashResult {
  return {
    ...toAdminResourceSubtreeMutation(dto),
    closedActiveRoomCount: dto.closedActiveRoomCount,
  }
}

function toAdminResourceRestoreResult(
  dto: AdminResourceRestoreResultDto
): AdminResourceRestoreResult {
  return {
    ...toAdminResourceSubtreeMutation(dto),
    node: toAdminResourceTreeNode(dto.node),
  }
}

function toAdminResourceSubtreeMutation(dto: AdminResourceTrashMutationDto) {
  return {
    affectedParentIds: [...dto.affectedParentIds],
    documentCount: dto.documentCount,
    folderCount: dto.folderCount,
    revision: dto.revision,
  }
}

function toAdminResourceLibraryDocument(
  dto: AdminResourceDocumentDto
): AdminResourceLibraryDocument {
  return {
    contentMarkdown: dto.contentMarkdown,
    contentRevision: dto.contentRevision,
    createdAt: dto.createdAt,
    createdBy: { ...dto.createdBy },
    id: dto.id,
    name: dto.name,
    parentId: dto.parentId,
    path: dto.path.map((item) => ({ ...item })),
    stateVersion: dto.stateVersion,
    status: dto.status,
    updatedAt: dto.updatedAt,
    updatedBy: { ...dto.updatedBy },
  }
}

function toAdminResourceDocumentTransactionResult(
  dto: AdminSaveResourceDocumentTransactionResponse
): AdminResourceDocumentTransactionResult {
  return {
    contentRevision: dto.contentRevision,
    kind: dto.kind,
    stateVersion: dto.stateVersion,
    transactionId: dto.transactionId,
  }
}

function toAdminResourceDocumentSync(
  dto: AdminReadResourceDocumentSyncResponse
): AdminResourceDocumentSync {
  switch (dto.kind) {
    case "up-to-date":
      return dto
    case "updates":
      return {
        fromStateVersion: dto.fromStateVersion,
        kind: dto.kind,
        stateVersion: dto.stateVersion,
        updates: dto.updatesBase64.map(decodeBase64),
      }
    case "snapshot":
      return {
        kind: dto.kind,
        snapshot: decodeBase64(dto.snapshotBase64),
        stateVersion: dto.stateVersion,
      }
  }
}

function encodeBase64(value: Uint8Array): string {
  let binary = ""

  for (const byte of value) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function toAdminImportResourceDocumentResult(
  dto: AdminImportResourceDocumentResultDto
): AdminImportResourceDocumentResult {
  return {
    document: toAdminResourceLibraryDocument(dto.document),
    mutation: toAdminResourceNodeMutation(dto.mutation),
  }
}

function toAdminResourceSearch(
  dto: AdminResourceSearchDto
): AdminResourceSearch {
  return {
    items: dto.items.map((item) => ({
      excerpt: item.excerpt,
      id: item.id,
      kind: item.kind,
      name: item.name,
      path: item.path.map((pathItem) => ({ ...pathItem })),
    })),
  }
}

function toAdminArchiveCourseResult(
  dto: AdminArchiveCourseResultDto
): AdminArchiveCourseResult {
  return {
    archived: dto.archived,
  }
}

function toAdminPagination(input: {
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}): AdminPagination {
  return {
    page: input.page,
    pageSize: input.pageSize,
    totalItems: input.totalItems,
    totalPages: input.totalPages,
  }
}

function createAdminHttpClient({
  baseUrl,
  fetch,
  requestOrigin,
  tokenProvider,
}: {
  readonly baseUrl: AdminApiBaseUrl
  readonly fetch: AdminFetchLike
  readonly requestOrigin?: string
  readonly tokenProvider: AdminTokenProvider
}): AdminHttpClient {
  return {
    async requestMarkdown(input) {
      const request = await createAdminRequest({
        baseUrl,
        method: "GET",
        path: input.path,
        requestOrigin,
        tokenProvider,
      })
      const fetchResult = await fetchHttpResponse(request, fetch)

      if (fetchResult.kind === "network-error") {
        return adminApiError(networkAdminApiError(fetchResult.error))
      }

      const { response } = fetchResult

      if (!response.ok) {
        const bodyResult = await readJson(response)

        return bodyResult.kind === "ok"
          ? adminApiError(toAdminApiError(response.status, bodyResult.value))
          : adminApiError(contractAdminApiError(response.status))
      }

      const fileName = readMarkdownFileName(response)

      if (fileName === null) {
        return adminApiError(contractAdminApiError(response.status))
      }

      return adminApiOk({
        fileName,
        markdown: await response.text(),
      })
    },
    async requestJson<TValue>(input: {
      readonly body?: unknown
      readonly method: AdminHttpMethod
      readonly path: string
      readonly schema: ResponseSchema<TValue>
    }) {
      const request = await createAdminRequest({
        baseUrl,
        body: input.body,
        method: input.method,
        path: input.path,
        requestOrigin,
        tokenProvider,
      })

      const fetchResult = await fetchHttpResponse(request, fetch)

      if (fetchResult.kind === "network-error") {
        return adminApiError(networkAdminApiError(fetchResult.error))
      }

      const { response } = fetchResult
      const bodyResult = await readJson(response)

      if (bodyResult.kind === "err") {
        return adminApiError(contractAdminApiError(response.status))
      }

      if (!response.ok) {
        return adminApiError(toAdminApiError(response.status, bodyResult.value))
      }

      const parsedBody = input.schema.safeParse(bodyResult.value)

      if (!parsedBody.success) {
        return adminApiError(contractAdminApiError(response.status))
      }

      return adminApiOk(parsedBody.data)
    },
  }
}

async function createAdminRequest(input: {
  readonly baseUrl: AdminApiBaseUrl
  readonly body?: unknown
  readonly method: AdminHttpMethod
  readonly path: string
  readonly requestOrigin?: string
  readonly tokenProvider: AdminTokenProvider
}): Promise<Request> {
  const headers = new Headers()
  const token = await input.tokenProvider()

  if (token !== null) {
    headers.set(
      "Cookie",
      `${adminSessionCookieName}=${encodeURIComponent(token)}`
    )
  }

  if (input.requestOrigin !== undefined) {
    headers.set("Origin", new URL(input.requestOrigin).origin)
  }

  if (input.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  return new Request(buildAdminApiUrl(input.baseUrl, input.path), {
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    credentials: "include",
    headers,
    method: input.method,
  })
}

function readMarkdownFileName(response: Response): string | null {
  const contentType = response.headers
    .get("Content-Type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase()
  const disposition = response.headers.get("Content-Disposition")
  const encodedFileName = disposition?.match(
    /^attachment;\s*filename\*=UTF-8''([^;]+)$/iu
  )?.[1]

  if (contentType !== "text/markdown" || encodedFileName === undefined) {
    return null
  }

  try {
    const fileName = decodeURIComponent(encodedFileName)

    return fileName.length > 0 ? fileName : null
  } catch {
    return null
  }
}

async function readJson(response: Response): Promise<
  | {
      readonly kind: "ok"
      readonly value: unknown
    }
  | {
      readonly kind: "err"
    }
> {
  const text = await response.text()

  if (text.length === 0) {
    return {
      kind: "ok",
      value: null,
    }
  }

  try {
    return {
      kind: "ok",
      value: JSON.parse(text) as unknown,
    }
  } catch {
    return {
      kind: "err",
    }
  }
}

function analyticsSearchParams(input: ReadAdminAnalyticsInput): string {
  const params = new URLSearchParams()

  params.set("days", String(input.days))

  return params.toString()
}

function coursesSearchParams(input: ReadAdminCoursesInput): string {
  const params = new URLSearchParams()

  params.set("category", input.category)
  params.set("page", String(input.page))
  params.set("pageSize", String(input.pageSize))
  params.set("query", input.query)
  params.set("status", input.status)

  return params.toString()
}

function lessonAnalyticsSearchParams(
  input: ReadAdminLessonAnalyticsInput
): string {
  const params = new URLSearchParams()

  params.set("direction", input.direction)
  params.set("page", String(input.page))
  params.set("pageSize", String(input.pageSize))
  params.set("query", input.query)
  params.set("sort", input.sort)

  return params.toString()
}

function usersSearchParams(input: ReadAdminUsersInput): string {
  const params = new URLSearchParams()

  params.set("page", String(input.page))
  params.set("pageSize", String(input.pageSize))
  params.set("query", input.query)
  params.set("sort", input.sort)
  params.set("status", input.status)

  return params.toString()
}

function resourceTreeSearchParams(input: {
  readonly parentId: string | null
  readonly scope: "active" | "trash"
}): string {
  const params = new URLSearchParams()

  if (input.parentId !== null) {
    params.set("parentId", input.parentId)
  }

  params.set("scope", input.scope)

  return params.toString()
}

function resourceSearchParams(input: {
  readonly limit: number
  readonly query: string
  readonly scope: "active" | "trash"
}): string {
  const params = new URLSearchParams()

  params.set("limit", String(input.limit))
  params.set("query", input.query)
  params.set("scope", input.scope)

  return params.toString()
}
