import { z } from "zod"

import {
  adminCourseEditorDocumentSchema,
  adminCourseEditorWriteDocumentSchema,
} from "#contracts/content/admin-courses"
import {
  courseIdSchema,
  curriculumVersionIdSchema,
} from "#contracts/content/ids"
import { adminMcpApprovalIdSchema } from "#contracts/operations/admin-mcp-approvals"
import {
  adminMcpExecutionIdSchema,
  adminMcpIdempotencyKeySchema,
} from "#contracts/operations/admin-mcp-executions"

export const adminMcpCreateCourseInputSchema = z
  .object({ idempotencyKey: adminMcpIdempotencyKeySchema })
  .strict()

export const adminMcpCourseLifecycleInputSchema = z
  .object({
    courseId: courseIdSchema,
    idempotencyKey: adminMcpIdempotencyKeySchema,
  })
  .strict()

export const adminMcpSaveCourseDraftInputSchema = z
  .object({
    document: adminCourseEditorWriteDocumentSchema,
    expectedEditVersion: z.number().int().nonnegative(),
    idempotencyKey: adminMcpIdempotencyKeySchema,
  })
  .strict()

export const adminMcpPublishCourseInputSchema = z
  .object({
    courseId: courseIdSchema,
    expectedEditVersion: z.number().int().nonnegative(),
    idempotencyKey: adminMcpIdempotencyKeySchema,
  })
  .strict()

export const adminMcpCreateCourseResultSchema = z
  .object({
    course: adminCourseEditorDocumentSchema,
    executionId: adminMcpExecutionIdSchema,
    replayed: z.boolean(),
  })
  .strict()

export const adminMcpSaveCourseDraftResultSchema = z
  .object({
    course: adminCourseEditorDocumentSchema,
    executionId: adminMcpExecutionIdSchema,
    replayed: z.boolean(),
  })
  .strict()

export const adminMcpArchiveCourseResultSchema = z
  .object({
    approvalId: adminMcpApprovalIdSchema,
    archived: z.literal(true),
    courseId: courseIdSchema,
    executionId: adminMcpExecutionIdSchema,
    replayed: z.boolean(),
  })
  .strict()

export const adminMcpRestoreCourseResultSchema = z
  .object({
    courseId: courseIdSchema,
    executionId: adminMcpExecutionIdSchema,
    replayed: z.boolean(),
    restored: z.literal(true),
  })
  .strict()

export const adminMcpPublishCourseResultSchema = z
  .object({
    approvalId: adminMcpApprovalIdSchema,
    curriculumVersionId: curriculumVersionIdSchema,
    executionId: adminMcpExecutionIdSchema,
    publishedAt: z.iso.datetime(),
    replayed: z.boolean(),
    revision: z.number().int().positive(),
  })
  .strict()

export type AdminMcpArchiveCourseResult = z.infer<
  typeof adminMcpArchiveCourseResultSchema
>
export type AdminMcpCreateCourseInput = z.infer<
  typeof adminMcpCreateCourseInputSchema
>
export type AdminMcpCreateCourseResult = z.infer<
  typeof adminMcpCreateCourseResultSchema
>
export type AdminMcpCourseLifecycleInput = z.infer<
  typeof adminMcpCourseLifecycleInputSchema
>
export type AdminMcpPublishCourseInput = z.infer<
  typeof adminMcpPublishCourseInputSchema
>
export type AdminMcpPublishCourseResult = z.infer<
  typeof adminMcpPublishCourseResultSchema
>
export type AdminMcpRestoreCourseResult = z.infer<
  typeof adminMcpRestoreCourseResultSchema
>
export type AdminMcpSaveCourseDraftInput = z.infer<
  typeof adminMcpSaveCourseDraftInputSchema
>
export type AdminMcpSaveCourseDraftResult = z.infer<
  typeof adminMcpSaveCourseDraftResultSchema
>
