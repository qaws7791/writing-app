import {
  adminCourseEditorDocumentSchema,
  type AdminCourseEditorDocument,
  type AdminPublishCourseResult,
} from "@workspace/contracts/content/admin-courses"

export const adminCourseEditorSchema = adminCourseEditorDocumentSchema
export type AdminCourseDetail = AdminCourseEditorDocument
export type AdminCoursePublishResult = AdminPublishCourseResult
