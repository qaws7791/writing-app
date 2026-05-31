import type {
  AdminEditorStepType,
  AdminCourseDetailDto,
  AdminEditorCurriculumDetailDto,
  AdminSaveCurriculumContentRequestDto,
} from "@workspace/core/admin"

import type { EditorChange } from "@/features/courses/course-editor/editor-change-kind"

export type CourseEditorDirtyState = {
  changes: EditorChange[]
  hasChanges: boolean
  changedFields: string[]
}

type CourseEditorCurriculumWorkingCopy = Omit<
  AdminEditorCurriculumDetailDto,
  "steps"
>

export type CourseEditorStep = AdminEditorCurriculumDetailDto["steps"][number]

export type CourseEditorWorkingCopy = {
  course: AdminCourseDetailDto
  dirty: CourseEditorDirtyState
  revision: number
  curriculum: CourseEditorCurriculumWorkingCopy
  steps: CourseEditorStep[]
}

type CourseEditableField = "description" | "title"
type ChapterEditableField = "title"
type LessonEditableField = "description" | "title"
type ChapterInput = {
  id: string
  title: string
}
type LessonInput = {
  description: string
  id: string
  lessonId: string
  title: string
}
type StepInput = {
  id: string
  lessonId: string
  title: string
  type: AdminEditorStepType
}

export function getDirtyState(
  changedFields: string[],
  changes: EditorChange[] = []
): CourseEditorDirtyState {
  return {
    changes,
    hasChanges: changedFields.length > 0,
    changedFields,
  }
}

export function createCourseEditorWorkingCopy(input: {
  course: AdminCourseDetailDto
  revision: number
  curriculum: AdminEditorCurriculumDetailDto
}): CourseEditorWorkingCopy {
  return {
    course: { ...input.course },
    dirty: getDirtyState([]),
    revision: input.revision,
    curriculum: {
      chapters: input.curriculum.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) => ({ ...lesson })),
      })),
    },
    steps: input.curriculum.steps.map((step) => ({
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
    `course.${field}`,
    {
      type: "course-field-updated",
      field,
    }
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
      curriculum: {
        ...workingCopy.curriculum,
        chapters: workingCopy.curriculum.chapters.map((chapter) => ({
          ...chapter,
          lessons: chapter.lessons.map((lesson) =>
            lesson.lessonId === lessonId
              ? { ...lesson, [field]: value }
              : lesson
          ),
        })),
      },
    },
    `lesson.${lessonId}.${field}`,
    {
      type: "lesson-field-updated",
      lessonId,
      field,
    }
  )
}

export function updateChapterField(
  workingCopy: CourseEditorWorkingCopy,
  chapterId: string,
  field: ChapterEditableField,
  value: string
): CourseEditorWorkingCopy {
  return withChangedField(
    {
      ...workingCopy,
      curriculum: {
        ...workingCopy.curriculum,
        chapters: workingCopy.curriculum.chapters.map((chapter) =>
          chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
        ),
      },
    },
    `chapter.${chapterId}.${field}`,
    {
      type: "chapter-field-updated",
      chapterId,
      field,
    }
  )
}

export function updateStepContentField(
  workingCopy: CourseEditorWorkingCopy,
  stepId: string,
  field: string,
  value: unknown
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
    `step.${stepId}.content.${field}`,
    {
      type: "step-content-updated",
      stepId,
      field,
    }
  )
}

export function addChapter(
  workingCopy: CourseEditorWorkingCopy,
  chapter: ChapterInput
): CourseEditorWorkingCopy {
  return withChangedField(
    {
      ...workingCopy,
      curriculum: {
        ...workingCopy.curriculum,
        chapters: [
          ...workingCopy.curriculum.chapters,
          {
            ...chapter,
            sortOrder: workingCopy.curriculum.chapters.length + 1,
            status: "active",
            lessons: [],
          },
        ],
      },
    },
    "chapter.add",
    {
      type: "chapter-added",
      chapterId: chapter.id,
    }
  )
}

export function archiveChapter(
  workingCopy: CourseEditorWorkingCopy,
  chapterId: string
): CourseEditorWorkingCopy {
  return withChangedField(
    {
      ...workingCopy,
      curriculum: {
        ...workingCopy.curriculum,
        chapters: workingCopy.curriculum.chapters.map((chapter) =>
          chapter.id === chapterId
            ? { ...chapter, status: "archived" }
            : chapter
        ),
      },
    },
    `chapter.${chapterId}.status`,
    {
      type: "chapter-archived",
      chapterId,
    }
  )
}

export function addLesson(
  workingCopy: CourseEditorWorkingCopy,
  chapterId: string,
  lesson: LessonInput
): CourseEditorWorkingCopy {
  return withChangedField(
    {
      ...workingCopy,
      curriculum: {
        ...workingCopy.curriculum,
        chapters: workingCopy.curriculum.chapters.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                lessons: [
                  ...chapter.lessons,
                  {
                    ...lesson,
                    sortOrder: chapter.lessons.length + 1,
                    status: "active",
                  },
                ],
              }
            : chapter
        ),
      },
    },
    "lesson.add",
    {
      type: "lesson-added",
      lessonId: lesson.lessonId,
    }
  )
}

export function archiveLesson(
  workingCopy: CourseEditorWorkingCopy,
  lessonId: string
): CourseEditorWorkingCopy {
  return withChangedField(
    {
      ...workingCopy,
      curriculum: {
        ...workingCopy.curriculum,
        chapters: workingCopy.curriculum.chapters.map((chapter) => ({
          ...chapter,
          lessons: chapter.lessons.map((lesson) =>
            lesson.lessonId === lessonId
              ? { ...lesson, status: "archived" }
              : lesson
          ),
        })),
      },
    },
    `lesson.${lessonId}.status`,
    {
      type: "lesson-archived",
      lessonId,
    }
  )
}

export function addStep(
  workingCopy: CourseEditorWorkingCopy,
  step: StepInput
): CourseEditorWorkingCopy {
  const lessonStepCount = workingCopy.steps.filter(
    (currentStep) => currentStep.lessonId === step.lessonId
  ).length

  return withChangedField(
    {
      ...workingCopy,
      steps: [
        ...workingCopy.steps,
        {
          ...step,
          content: {},
          points: 0,
          required: true,
          sortOrder: lessonStepCount + 1,
          status: "active",
        },
      ],
    },
    "step.add",
    {
      type: "step-added",
      stepId: step.id,
    }
  )
}

export function archiveStep(
  workingCopy: CourseEditorWorkingCopy,
  stepId: string
): CourseEditorWorkingCopy {
  return withChangedField(
    {
      ...workingCopy,
      steps: workingCopy.steps.map((step) =>
        step.id === stepId ? { ...step, status: "archived" } : step
      ),
    },
    `step.${stepId}.status`,
    {
      type: "step-archived",
      stepId,
    }
  )
}

export function createCourseEditorSaveInput(
  workingCopy: CourseEditorWorkingCopy
): AdminSaveCurriculumContentRequestDto {
  return {
    courseId: workingCopy.course.id,
    expectedRevision: workingCopy.revision,
    course: {
      title: workingCopy.course.title,
      description: workingCopy.course.description,
      sortOrder: workingCopy.course.sortOrder,
    },
    chapters: workingCopy.curriculum.chapters.map((chapter) => ({
      id: chapter.id,
      sortOrder: chapter.sortOrder,
      status: chapter.status,
      title: chapter.title,
    })),
    lessons: workingCopy.curriculum.chapters.flatMap((chapter) =>
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
  const flatLessons = workingCopy.curriculum.chapters.flatMap(
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
      curriculum: {
        ...workingCopy.curriculum,
        chapters: workingCopy.curriculum.chapters.map((chapter) => {
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
    "lesson.order",
    {
      type: "lesson-reordered",
      lessonId,
      targetIndex,
    }
  )
}

export function moveStep(
  workingCopy: CourseEditorWorkingCopy,
  lessonId: string,
  stepId: string,
  targetIndex: number
): CourseEditorWorkingCopy {
  const lessonSteps = workingCopy.steps.filter(
    (step) => step.lessonId === lessonId
  )
  const fromIndex = lessonSteps.findIndex((step) => step.id === stepId)

  if (
    fromIndex < 0 ||
    targetIndex < 0 ||
    targetIndex >= lessonSteps.length ||
    fromIndex === targetIndex
  ) {
    return workingCopy
  }

  const movedLessonSteps = moveItem(lessonSteps, fromIndex, targetIndex).map(
    (step, index) => ({
      ...step,
      sortOrder: index + 1,
    })
  )
  const movedStepById = new Map(movedLessonSteps.map((step) => [step.id, step]))

  return withChangedField(
    {
      ...workingCopy,
      steps: workingCopy.steps
        .map((step) => movedStepById.get(step.id) ?? step)
        .sort((left, right) => {
          if (left.lessonId !== right.lessonId) {
            return 0
          }

          return left.sortOrder - right.sortOrder
        }),
    },
    "step.order",
    {
      type: "step-reordered",
      stepId,
      targetIndex,
    }
  )
}

function withChangedField(
  workingCopy: CourseEditorWorkingCopy,
  field: string,
  change: EditorChange
): CourseEditorWorkingCopy {
  const changedFields = workingCopy.dirty.changedFields.includes(field)
    ? workingCopy.dirty.changedFields
    : [...workingCopy.dirty.changedFields, field]
  const changes = workingCopy.dirty.changes.some((currentChange) =>
    isSameEditorChange(currentChange, change)
  )
    ? workingCopy.dirty.changes
    : [...workingCopy.dirty.changes, change]

  return {
    ...workingCopy,
    dirty: getDirtyState(changedFields, changes),
  }
}

function isSameEditorChange(left: EditorChange, right: EditorChange) {
  return getEditorChangeKey(left) === getEditorChangeKey(right)
}

function getEditorChangeKey(change: EditorChange): string {
  switch (change.type) {
    case "course-field-updated":
      return `${change.type}:${change.field}`
    case "chapter-added":
    case "chapter-archived":
      return `${change.type}:${change.chapterId}`
    case "chapter-field-updated":
      return `${change.type}:${change.chapterId}:${change.field}`
    case "lesson-added":
    case "lesson-archived":
      return `${change.type}:${change.lessonId}`
    case "lesson-field-updated":
      return `${change.type}:${change.lessonId}:${change.field}`
    case "step-added":
    case "step-archived":
      return `${change.type}:${change.stepId}`
    case "step-content-updated":
      return `${change.type}:${change.stepId}:${change.field}`
    case "lesson-reordered":
      return `${change.type}:${change.lessonId}:${change.targetIndex}`
    case "step-reordered":
      return `${change.type}:${change.stepId}:${change.targetIndex}`
  }
}

function cloneJsonValue<TValue>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
