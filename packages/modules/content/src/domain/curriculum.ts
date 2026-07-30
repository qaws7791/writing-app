import { err, ok, type Result } from "@workspace/kernel/result"

import type { ContentError } from "#content/domain/content-error"
import {
  contentStatuses,
  lessonStepTypeValues,
  type Course,
  type CurriculumDraft,
  type CurriculumLesson,
  type CurriculumStep,
  type CurriculumUnit,
  type PublishedCurriculumRevision,
} from "#content/domain/content-model"
import { parseJsonObject } from "#content/domain/content-normalization"

export function createCurriculumDraft(
  input: CurriculumDraft
): Result<CurriculumDraft, ContentError> {
  const validation = validateCurriculumDraft(input, false)
  return validation.isErr() ? err(validation.error) : ok(cloneDraft(input))
}

export function decidePublishCurriculum(input: {
  readonly draft: CurriculumDraft
  readonly now: Date
}): Result<PublishedCurriculumRevision, ContentError> {
  const validation = validateCurriculumDraft(input.draft, true)
  if (validation.isErr()) return err(validation.error)

  const published = clonePublishedRevision({
    category: input.draft.category,
    courseId: input.draft.courseId,
    coverAssetId: input.draft.coverAssetId,
    curriculumVersionId: input.draft.curriculumVersionId,
    description: input.draft.description,
    publishedAt: input.now,
    revision: input.draft.revision,
    title: input.draft.title,
    units: input.draft.units,
    visualKey: input.draft.visualKey,
  })
  return ok(published)
}

export function decideArchiveCourse(
  course: Course
): Result<Course, ContentError> {
  if (course.status === contentStatuses.archived) {
    return err({ kind: "content-not-found" })
  }

  return ok({
    ...course,
    createdAt: new Date(course.createdAt),
    status: contentStatuses.archived,
  })
}

function validateCurriculumDraft(
  draft: CurriculumDraft,
  requireCompleteHierarchy: boolean
): Result<void, ContentError> {
  if (
    draft.courseId.length === 0 ||
    draft.curriculumVersionId.length === 0 ||
    draft.title.trim().length === 0 ||
    draft.revision <= 0 ||
    !Number.isInteger(draft.revision) ||
    draft.editVersion < 0 ||
    !Number.isInteger(draft.editVersion)
  ) {
    return validationError("invalid-course-reference")
  }
  if (requireCompleteHierarchy && draft.units.length === 0) {
    return validationError("empty-unit")
  }
  if (!hasContiguousSortOrders(draft.units)) {
    return validationError("invalid-sort-order")
  }

  const ids = new Set<string>()
  for (const unit of draft.units) {
    if (!addUniqueId(ids, unit.id) || unit.title.trim().length === 0) {
      return validationError("duplicate-id")
    }
    if (requireCompleteHierarchy && unit.lessons.length === 0) {
      return validationError("empty-lesson")
    }
    if (!hasContiguousSortOrders(unit.lessons)) {
      return validationError("invalid-sort-order")
    }

    for (const lesson of unit.lessons) {
      if (!addUniqueId(ids, lesson.id) || lesson.title.trim().length === 0) {
        return validationError("duplicate-id")
      }
      if (
        !Number.isInteger(lesson.estimatedMinutes) ||
        lesson.estimatedMinutes <= 0
      ) {
        return validationError("invalid-lesson-reference")
      }
      if (requireCompleteHierarchy && lesson.steps.length === 0) {
        return validationError("empty-step-content")
      }
      if (!hasContiguousSortOrders(lesson.steps)) {
        return validationError("invalid-sort-order")
      }

      const lessonValidation = validateLessonSteps(lesson.steps, ids)
      if (lessonValidation.isErr()) return lessonValidation
    }
  }

  return ok(undefined)
}

function validateLessonSteps(
  steps: readonly CurriculumStep[],
  documentIds: Set<string>
): Result<void, ContentError> {
  const stepsById = new Map<string, CurriculumStep>(
    steps.map((step) => [step.id, step])
  )

  for (const step of steps) {
    if (!addUniqueId(documentIds, step.id)) {
      return validationError("duplicate-id")
    }
    if (!lessonStepTypeValues.some((candidate) => candidate === step.type)) {
      return validationError("invalid-step-type")
    }
    const content = parseJsonObject(step.contentJson)
    if (content === null) return validationError("invalid-step-content")

    if (step.type === "AI_FEEDBACK") {
      const targetId = content["target"]
      const target =
        typeof targetId === "string" ? stepsById.get(targetId) : undefined
      if (
        target === undefined ||
        target.type !== "WRITE" ||
        target.sortOrder >= step.sortOrder
      ) {
        return validationError("invalid-ai-feedback-target")
      }
    }

    if (!hasValidSelectableItemReferences(step.type, content)) {
      return validationError("invalid-selectable-item-reference")
    }
  }

  return ok(undefined)
}

function hasValidSelectableItemReferences(
  type: CurriculumStep["type"],
  content: { [key: string]: unknown }
): boolean {
  switch (type) {
    case "MULTIPLE_CHOICE": {
      const options = readObjectArray(content["options"])
      const ids = options?.map((option) => option["id"])
      return (
        ids !== undefined &&
        hasUniqueStringIds(ids) &&
        typeof content["correct"] === "string" &&
        ids.includes(content["correct"])
      )
    }
    case "FILL_BLANK":
      return hasParallelUniqueIds(content["words"], content["wordIds"])
    case "SELECT":
      return hasParallelUniqueIds(content["segments"], content["segmentIds"])
    case "ORDER":
      return hasParallelUniqueIds(content["items"], content["itemIds"])
    case "MATCH": {
      const pairs = readObjectArray(content["pairs"])
      return (
        pairs !== null &&
        hasUniqueStringIds(
          pairs.flatMap((pair) => [pair["leftId"], pair["rightId"]])
        )
      )
    }
    case "CATEGORIZE": {
      const categories = readObjectArray(content["categories"])
      const items = readObjectArray(content["items"])
      if (categories === null || items === null) return false
      const categoryIds = categories.map((category) => category["id"])
      const itemIds = items.map((item) => item["id"])
      return (
        hasUniqueStringIds(categoryIds) &&
        hasUniqueStringIds(itemIds) &&
        items.every(
          (item) =>
            typeof item["categoryId"] === "string" &&
            categoryIds.includes(item["categoryId"])
        )
      )
    }
    default:
      return true
  }
}

function hasParallelUniqueIds(items: unknown, ids: unknown): boolean {
  return (
    Array.isArray(items) &&
    Array.isArray(ids) &&
    items.length === ids.length &&
    hasUniqueStringIds(ids)
  )
}

function hasUniqueStringIds(ids: readonly unknown[]): ids is readonly string[] {
  return (
    ids.every((id) => typeof id === "string" && id.length > 0) &&
    new Set(ids).size === ids.length
  )
}

function readObjectArray(
  value: unknown
): readonly { [key: string]: unknown }[] | null {
  if (!Array.isArray(value)) return null
  return value.every(isJsonObject) ? value : null
}

function isJsonObject(value: unknown): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasContiguousSortOrders(
  items: readonly { readonly sortOrder: number }[]
): boolean {
  return items.every(
    (item, index) =>
      Number.isInteger(item.sortOrder) && item.sortOrder === index + 1
  )
}

function addUniqueId(ids: Set<string>, id: string): boolean {
  if (id.length === 0 || ids.has(id)) return false
  ids.add(id)
  return true
}

function validationError(
  reason: Extract<ContentError, { kind: "content-validation-failed" }>["reason"]
): Result<never, ContentError> {
  return err({ kind: "content-validation-failed", reason })
}

function cloneDraft(draft: CurriculumDraft): CurriculumDraft {
  return {
    ...draft,
    units: cloneUnits(draft.units),
  }
}

function clonePublishedRevision(
  revision: PublishedCurriculumRevision
): PublishedCurriculumRevision {
  return {
    ...revision,
    publishedAt: new Date(revision.publishedAt),
    units: cloneUnits(revision.units),
  }
}

function cloneUnits(
  units: readonly CurriculumUnit[]
): readonly CurriculumUnit[] {
  return units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson: CurriculumLesson) => ({
      ...lesson,
      steps: lesson.steps.map((step) => ({ ...step })),
      summary: [...lesson.summary],
    })),
  }))
}
