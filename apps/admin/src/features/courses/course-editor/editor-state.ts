import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumVersionDetailDto,
  AdminSaveCurriculumVersionContentRequestDto,
} from "@workspace/core/admin"

export type CourseEditorDirtyState = {
  hasChanges: boolean
  changedFields: string[]
}

export type CourseEditorWorkingCopy = {
  baseRevision: number
  course: AdminCourseDetailDto
  dirty: CourseEditorDirtyState
  version: AdminEditorCurriculumVersionDetailDto
  steps: AdminEditorCurriculumVersionDetailDto["steps"]
}

type CourseEditableField = "description" | "thumbnailPath" | "title"
type LessonEditableField = "description" | "title"

export function getDirtyState(changedFields: string[]): CourseEditorDirtyState {
  return {
    hasChanges: changedFields.length > 0,
    changedFields,
  }
}

export function createCourseEditorWorkingCopy(input: {
  course: AdminCourseDetailDto
  version: AdminEditorCurriculumVersionDetailDto
}): CourseEditorWorkingCopy {
  return {
    baseRevision: input.version.revision,
    course: { ...input.course },
    dirty: getDirtyState([]),
    version: {
      ...input.version,
      chapters: input.version.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) => ({ ...lesson })),
      })),
      steps: input.version.steps.map((step) => ({
        ...step,
        content: cloneJsonValue(step.content),
      })),
    },
    steps: input.version.steps.map((step) => ({
      ...step,
      content: cloneJsonValue(step.content),
    })),
  }
}

export function updateCourseField(
  workingCopy: CourseEditorWorkingCopy,
  field: CourseEditableField,
  value: string
): CourseEditorWorkingCopy {
  return withChangedField(
    {
      ...workingCopy,
      course: {
        ...workingCopy.course,
        [field]: value,
      },
    },
    `course.${field}`
  )
}

export function updateLessonField(
  workingCopy: CourseEditorWorkingCopy,
  lessonId: string,
  field: LessonEditableField,
  value: string
): CourseEditorWorkingCopy {
  return withChangedField(
    {
      ...workingCopy,
      version: {
        ...workingCopy.version,
        chapters: workingCopy.version.chapters.map((chapter) => ({
          ...chapter,
          lessons: chapter.lessons.map((lesson) =>
            lesson.lessonId === lessonId
              ? { ...lesson, [field]: value }
              : lesson
          ),
        })),
      },
    },
    `lesson.${lessonId}.${field}`
  )
}

export function updateStepContentField(
  workingCopy: CourseEditorWorkingCopy,
  stepId: string,
  field: string,
  value: string
): CourseEditorWorkingCopy {
  return withChangedField(
    {
      ...workingCopy,
      steps: workingCopy.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              content: {
                ...(isRecord(step.content) ? step.content : {}),
                [field]: value,
              },
            }
          : step
      ),
    },
    `step.${stepId}.content.${field}`
  )
}

export function createCourseEditorSaveInput(
  workingCopy: CourseEditorWorkingCopy
): AdminSaveCurriculumVersionContentRequestDto {
  return {
    courseId: workingCopy.course.id,
    versionId: workingCopy.version.id,
    baseRevision: workingCopy.baseRevision,
    course: {
      title: workingCopy.course.title,
      description: workingCopy.course.description,
      thumbnailPath: workingCopy.course.thumbnailPath,
      sortOrder: workingCopy.course.sortOrder,
    },
    chapters: workingCopy.version.chapters.map((chapter) => ({
      id: chapter.id,
      label: chapter.label,
      sortOrder: chapter.sortOrder,
      status: chapter.status,
      title: chapter.title,
    })),
    lessons: workingCopy.version.chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        ...lesson,
        chapterId: chapter.id,
      }))
    ),
    steps: workingCopy.steps,
  }
}

export function moveItem<TItem>(
  items: readonly TItem[],
  fromIndex: number,
  toIndex: number
): TItem[] {
  const nextItems = [...items]
  const [item] = nextItems.splice(fromIndex, 1)

  if (item === undefined) {
    return nextItems
  }

  nextItems.splice(toIndex, 0, item)
  return nextItems
}

export function moveLesson(
  workingCopy: CourseEditorWorkingCopy,
  lessonId: string,
  targetIndex: number
): CourseEditorWorkingCopy {
  const flatLessons = workingCopy.version.chapters.flatMap(
    (chapter) => chapter.lessons
  )
  const fromIndex = flatLessons.findIndex(
    (lesson) => lesson.lessonId === lessonId
  )

  if (
    fromIndex < 0 ||
    targetIndex < 0 ||
    targetIndex >= flatLessons.length ||
    fromIndex === targetIndex
  ) {
    return workingCopy
  }

  const movedLessons = moveItem(flatLessons, fromIndex, targetIndex)
  let lessonCursor = 0

  return withChangedField(
    {
      ...workingCopy,
      version: {
        ...workingCopy.version,
        chapters: workingCopy.version.chapters.map((chapter) => {
          const nextLessons = movedLessons
            .slice(lessonCursor, lessonCursor + chapter.lessons.length)
            .map((lesson, index) => ({
              ...lesson,
              sortOrder: index + 1,
            }))

          lessonCursor += chapter.lessons.length

          return {
            ...chapter,
            lessons: nextLessons,
          }
        }),
      },
    },
    "lesson.order"
  )
}

function withChangedField(
  workingCopy: CourseEditorWorkingCopy,
  field: string
): CourseEditorWorkingCopy {
  const changedFields = workingCopy.dirty.changedFields.includes(field)
    ? workingCopy.dirty.changedFields
    : [...workingCopy.dirty.changedFields, field]

  return {
    ...workingCopy,
    dirty: getDirtyState(changedFields),
  }
}

function cloneJsonValue<TValue>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
