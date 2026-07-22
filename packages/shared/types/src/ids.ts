import type { Brand } from "#types/brand"

export type AdminId = Brand<string, "AdminId">
export type ConversationId = Brand<string, "ConversationId">
export type CourseId = Brand<string, "CourseId">
export type CurriculumVersionId = Brand<string, "CurriculumVersionId">
export type LearnerId = Brand<string, "LearnerId">
export type LessonId = Brand<string, "LessonId">
export type LessonStepId = Brand<string, "LessonStepId">
export type LessonStepItemId = Brand<string, "LessonStepItemId">
export type MessageId = Brand<string, "MessageId">
export type ResourceAssetId = Brand<string, "ResourceAssetId">
export type ResourceDocumentId = Brand<string, "ResourceDocumentId">
export type ResourceFolderId = Brand<string, "ResourceFolderId">
export type ResourceNodeId = ResourceDocumentId | ResourceFolderId
export type UnitId = Brand<string, "UnitId">
export type UserId = Brand<string, "UserId">
