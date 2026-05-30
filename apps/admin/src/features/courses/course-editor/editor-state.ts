import type {
  AdminEditorStepType,
  AdminCourseDetailDto,
  AdminEditorCurriculumDetailDto,
  AdminSaveCurriculumContentRequestDto,
} from "@workspace/core/admin"

export type CourseEditorDirtyState = {
  hasChanges: boolean
  changedFields: string[]
}

export type CourseEditorWorkingCopy = {
  course: AdminCourseDetailDto
  dirty: CourseEditorDirtyState
  revision: number
  curriculum: AdminEditorCurriculumDetailDto
  steps: AdminEditorCurriculumDetailDto["steps"]
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

export function getDirtyState(changedFields: string[]): CourseEditorDirtyState {
  return {
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
      ...input.curriculum,
      chapters: input.curriculum.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) => ({ ...lesson })),
      })),
      steps: input.curriculum.steps.map((step) => ({
        ...step,
        content: cloneJsonValue(step.content),
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
    `lesson.${lessonId}.${field}`
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
    `chapter.${chapterId}.${field}`
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
    `step.${stepId}.content.${field}`
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
    "chapter.add"
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
    `chapter.${chapterId}.status`
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
    "lesson.add"
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
    `lesson.${lessonId}.status`
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
    "step.add"
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
    `step.${stepId}.status`
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
    "lesson.order"
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
    "step.order"
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
