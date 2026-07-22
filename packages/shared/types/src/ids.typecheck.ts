import type {
  AdminId,
  ConversationId,
  CourseId,
  LearnerId,
  LessonId,
  ResourceDocumentId,
  ResourceFolderId,
  ResourceNodeId,
  UserId,
} from "#types/ids"

declare const adminId: AdminId
declare const conversationId: ConversationId
declare const courseId: CourseId
declare const learnerId: LearnerId
declare const lessonId: LessonId
declare const resourceDocumentId: ResourceDocumentId
declare const resourceFolderId: ResourceFolderId
declare const userId: UserId

function acceptsAdminId(_value: AdminId): void {}
function acceptsConversationId(_value: ConversationId): void {}
function acceptsCourseId(_value: CourseId): void {}
function acceptsLearnerId(_value: LearnerId): void {}
function acceptsLessonId(_value: LessonId): void {}
function acceptsResourceNodeId(_value: ResourceNodeId): void {}
function acceptsUserId(_value: UserId): void {}

acceptsAdminId(adminId)
acceptsConversationId(conversationId)
acceptsCourseId(courseId)
acceptsLearnerId(learnerId)
acceptsLessonId(lessonId)
acceptsResourceNodeId(resourceDocumentId)
acceptsResourceNodeId(resourceFolderId)
acceptsUserId(userId)

// @ts-expect-error UserId는 AdminId 경계에 전달할 수 없다.
acceptsAdminId(userId)
// @ts-expect-error CourseId는 LessonId 경계에 전달할 수 없다.
acceptsLessonId(courseId)
// @ts-expect-error LearnerId는 UserId 경계에 암묵적으로 전달할 수 없다.
acceptsUserId(learnerId)
// @ts-expect-error ConversationId는 resource node가 아니다.
acceptsResourceNodeId(conversationId)
