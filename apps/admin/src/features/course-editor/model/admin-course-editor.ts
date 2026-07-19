import {
  adminCourseEditorDocumentSchema,
  type AdminCourseEditorDocument,
  type AdminPublishCourseResult,
} from "@workspace/contracts/admin"

export const adminCourseEditorSchema = adminCourseEditorDocumentSchema
export type AdminCourseDetail = AdminCourseEditorDocument
export type AdminCoursePublishResult = AdminPublishCourseResult
