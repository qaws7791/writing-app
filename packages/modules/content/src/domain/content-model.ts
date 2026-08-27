import type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

/** Prevents runtime mutation from changing shared domain and persistence status checks. */
export const contentStatuses = Object.freeze({
  active: "active",
  archived: "archived",
} as const)

/** Prevents runtime mutation from changing the shared schema enum vocabulary. */
export const contentStatusValues = Object.freeze([
  contentStatuses.active,
  contentStatuses.archived,
] as const)

export type ContentStatus = (typeof contentStatusValues)[number]

/** Prevents runtime mutation from changing persisted step discriminator validation. */
export const lessonStepTypeValues = Object.freeze([
  "READING",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "SELECT",
  "ORDER",
  "MATCH",
  "CATEGORIZE",
  "TRUE_FALSE",
  "SENTENCE_BUILD",
  "ERROR_CORRECT",
] as const)

export type LessonStepType = (typeof lessonStepTypeValues)[number]

/** Prevents runtime mutation from changing persisted visual-key validation. */
export const courseVisualKeyValues = Object.freeze([
  "basic-sentence-writing",
  "grammar-complete",
  "essay-writing",
  "creative-writing",
  "expression",
  "business-email",
  "business-writing",
  "emotion-writing",
  "reading-comprehension",
  "sentence-structure",
  "vocabulary-basics",
] as const)

export type CourseVisualKey = (typeof courseVisualKeyValues)[number]

export type Course = Readonly<{
  createdAt: Date
  id: CourseId
  publishedCurriculumVersionId: CurriculumVersionId | null
  sortOrder: number
  status: ContentStatus
}>

export type CurriculumStep = Readonly<{
  contentJson: string
  id: LessonStepId
  sortOrder: number
  status: ContentStatus
  type: LessonStepType
}>

export type CurriculumLesson = Readonly<{
  category: string | null
  description: string | null
  estimatedMinutes: number
  id: LessonId
  sortOrder: number
  status: ContentStatus
  steps: readonly CurriculumStep[]
  summary: readonly string[]
  title: string
}>

export type CurriculumUnit = Readonly<{
  id: UnitId
  lessons: readonly CurriculumLesson[]
  sortOrder: number
  status: ContentStatus
  title: string
}>

export type CurriculumDraft = Readonly<{
  category: string
  courseId: CourseId
  coverAssetId: ContentAssetId | null
  curriculumVersionId: CurriculumVersionId
  description: string
  editVersion: number
  revision: number
  title: string
  units: readonly CurriculumUnit[]
  visualKey: CourseVisualKey
}>

export type PublishedCurriculumRevision = Readonly<{
  category: string
  courseId: CourseId
  coverAssetId: ContentAssetId | null
  curriculumVersionId: CurriculumVersionId
  description: string
  publishedAt: Date
  revision: number
  title: string
  units: readonly CurriculumUnit[]
  visualKey: CourseVisualKey
}>

export type PublishedCourseSummary = Readonly<{
  category: string
  courseId: CourseId
  coverAssetId: ContentAssetId | null
  description: string
  lessonCount: number
  revision: number
  sortOrder: number
  title: string
  versionId: CurriculumVersionId
  visualKey: CourseVisualKey
}>

export type PublishedLessonReference = Readonly<{
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  lessonId: LessonId
  revision: number
}>

export function createCourseId(value: string): CourseId {
  if (value.trim().length === 0) throw new Error("Course ID cannot be empty")
  return value as CourseId
}

export function readCurriculumVersionId(value: string): CurriculumVersionId {
  if (value.trim().length === 0) {
    throw new Error("Curriculum version ID cannot be empty")
  }
  return value as CurriculumVersionId
}

export function readUnitId(value: string): UnitId {
  if (value.trim().length === 0) throw new Error("Unit ID cannot be empty")
  return value as UnitId
}

export function readLessonId(value: string): LessonId {
  if (value.trim().length === 0) throw new Error("Lesson ID cannot be empty")
  return value as LessonId
}

export function readLessonStepId(value: string): LessonStepId {
  if (value.trim().length === 0) throw new Error("Step ID cannot be empty")
  return value as LessonStepId
}

export function createCurriculumVersionId(
  courseId: CourseId,
  revision: number
): CurriculumVersionId {
  if (!Number.isInteger(revision) || revision <= 0) {
    throw new Error("Curriculum revision must be a positive integer")
  }
  return `curriculum:${courseId}:${revision}` as CurriculumVersionId
}

export function readLessonStepType(value: string): LessonStepType | null {
  return lessonStepTypeValues.some((candidate) => candidate === value)
    ? (value as LessonStepType)
    : null
}

export function readCourseVisualKey(value: string): CourseVisualKey {
  return courseVisualKeyValues.some((candidate) => candidate === value)
    ? (value as CourseVisualKey)
    : "basic-sentence-writing"
}
