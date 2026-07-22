import {
  adminCourseDetailDtoSchema,
  adminCourseEditorDocumentSchema,
  adminCourseListDtoSchema,
  adminPublishCourseResultSchema,
  type AdminCourseDetailDto,
  type AdminCourseEditorDocument,
  type AdminCourseListDto,
  type AdminPublishCourseResult,
} from "@workspace/contracts/content/admin-courses"
import {
  adminContentResetResultSchema,
  type AdminContentResetResultDto,
} from "@workspace/contracts/content/admin-content-reset"
import { err, ok, type Result } from "@workspace/kernel/result"

import type { ContentError } from "#content/domain/content-error"
import type {
  CurriculumLesson,
  CurriculumStep,
  CurriculumUnit,
} from "#content/domain/content-model"
import { normalizeVersionedStepContent } from "#content/domain/content-normalization"
import type {
  ContentCoursePage,
  ContentResetResult,
  CourseEditorDocument,
} from "#content/application/ports/content-ports"
import type { PublishedCourseResult } from "#content/application/use-cases/publish-course"

export function toCourseEditorDocument(
  document: AdminCourseEditorDocument
): Result<CourseEditorDocument, ContentError> {
  const units: CurriculumUnit[] = []

  for (const unit of document.units) {
    const lessons: CurriculumLesson[] = []
    for (const lesson of unit.lessons) {
      const steps: CurriculumStep[] = []
      for (const step of lesson.steps) {
        const { id, sortOrder, status, type, ...content } = step
        const normalized = normalizeVersionedStepContent(
          id,
          type,
          JSON.stringify({
            ...content,
            type: type.toLocaleLowerCase("en-US"),
          })
        )
        if (normalized.isErr()) return err(normalized.error)

        steps.push({
          contentJson: normalized.value,
          id,
          sortOrder,
          status,
          type,
        })
      }

      lessons.push({
        category: lesson.category,
        description: lesson.description,
        estimatedMinutes: lesson.estimatedMinutes,
        id: lesson.id,
        sortOrder: lesson.sortOrder,
        status: lesson.status,
        steps,
        summary: lesson.summary,
        title: lesson.title,
      })
    }

    units.push({
      id: unit.id,
      lessons,
      sortOrder: unit.sortOrder,
      status: unit.status,
      title: unit.title,
    })
  }

  return ok({
    category: document.category,
    courseId: document.id,
    curriculumVersionId: document.curriculumVersionId,
    description: document.description,
    editVersion: document.editVersion,
    revision: document.revision,
    title: document.title,
    units,
  })
}

export function toAdminCourseEditorDocument(
  document: CourseEditorDocument
): AdminCourseEditorDocument {
  return adminCourseEditorDocumentSchema.parse({
    category: document.category,
    curriculumVersionId: document.curriculumVersionId,
    description: document.description,
    editVersion: document.editVersion,
    id: document.courseId,
    revision: document.revision,
    status: "active",
    title: document.title,
    units: document.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => ({
        ...lesson,
        steps: lesson.steps.map(toAdminCourseEditorStep),
      })),
    })),
  })
}

export function toAdminCourseDetail(
  document: CourseEditorDocument
): AdminCourseDetailDto {
  return adminCourseDetailDtoSchema.parse({
    category: document.category,
    curriculumVersionId: document.curriculumVersionId,
    description: document.description,
    editVersion: document.editVersion,
    id: document.courseId,
    revision: document.revision,
    status: "active",
    title: document.title,
    units: document.units,
  })
}

export function toAdminCourseList(page: ContentCoursePage): AdminCourseListDto {
  return adminCourseListDtoSchema.parse({
    items: page.items,
    pagination: {
      page: page.page,
      pageSize: page.pageSize,
      totalItems: page.totalItems,
      totalPages: page.totalPages,
    },
  })
}

export function toAdminPublishResult(
  result: PublishedCourseResult
): AdminPublishCourseResult {
  return adminPublishCourseResultSchema.parse({
    ...result,
    publishedAt: result.publishedAt.toISOString(),
  })
}

export function toAdminContentResetResult(
  result: ContentResetResult
): AdminContentResetResultDto {
  return adminContentResetResultSchema.parse(result)
}

function toAdminCourseEditorStep(step: CurriculumStep): unknown {
  const content = parseContentObject(step)
  const { type: _persistedType, ...wireContent } = content
  return {
    ...wireContent,
    id: step.id,
    sortOrder: step.sortOrder,
    status: step.status,
    type: step.type,
  }
}

function parseContentObject(step: CurriculumStep): { [key: string]: unknown } {
  const value: unknown = JSON.parse(step.contentJson)
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid persisted content step: ${step.id}`)
  }
  return value as { [key: string]: unknown }
}
