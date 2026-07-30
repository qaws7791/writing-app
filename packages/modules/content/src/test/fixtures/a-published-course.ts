import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

export type PublishedCourseFixture = Readonly<{
  courseId: string
  curriculumVersionId: string
  lessonId: string
  stepId: string
  unitId: string
}>

type PublishedCourseLessonOptions = Readonly<{
  lessonId?: string
  lessonTitle?: string
  stepId?: string
  stepType?: string
}>

type PublishedCourseOptions = Readonly<{
  additionalLessons?: readonly PublishedCourseLessonOptions[]
  courseId?: string
  curriculumVersionId?: string
  lessonId?: string
  lessonTitle?: string
  stepId?: string
  stepType?: string
  unitId?: string
}>

export function aPublishedCourse(
  sqlite: WritingAppSqlite,
  options: PublishedCourseOptions = {}
): PublishedCourseFixture {
  const courseId = options.courseId ?? "course-1"
  const curriculumVersionId = options.curriculumVersionId ?? "version-1"
  const unitId = options.unitId ?? "unit-1"
  const lessonId = options.lessonId ?? "lesson-1"
  const stepId = options.stepId ?? "step-1"
  const lessonTitle = options.lessonTitle ?? "레슨"
  const stepType = options.stepType ?? "AI_FEEDBACK"

  sqlite
    .query<void, [string]>(
      `INSERT INTO courses (
        id, status, sort_order, published_curriculum_version_id, created_at
      ) VALUES (?1, 'active', 1, NULL, 1)`
    )
    .run(courseId)

  sqlite
    .query<void, [string, string]>(
      `INSERT INTO course_curriculum_versions (
        id, course_id, revision, edit_version, status, title, description,
        category, visual_key, created_at, updated_at, published_at
      ) VALUES (
        ?1, ?2, 1, 0, 'draft', '코스', '설명',
        '기초', 'basic-sentence-writing', 1, 1, NULL
      )`
    )
    .run(curriculumVersionId, courseId)

  sqlite
    .query<void, [string, string]>(
      `INSERT INTO course_unit_versions (
        curriculum_version_id, id, title, status, sort_order
      ) VALUES (?1, ?2, '단원', 'active', 1)`
    )
    .run(curriculumVersionId, unitId)

  insertLesson(sqlite, {
    curriculumVersionId,
    lessonId,
    lessonTitle,
    sortOrder: 1,
    stepId,
    stepType,
    unitId,
  })

  ;(options.additionalLessons ?? []).forEach((lesson, index) => {
    insertLesson(sqlite, {
      curriculumVersionId,
      lessonId: lesson.lessonId ?? `lesson-${index + 2}`,
      lessonTitle: lesson.lessonTitle ?? "레슨",
      sortOrder: index + 2,
      stepId: lesson.stepId ?? `step-${index + 2}`,
      stepType: lesson.stepType ?? stepType,
      unitId,
    })
  })

  sqlite
    .query<void, [string]>(
      `UPDATE course_curriculum_versions
       SET status = 'published', published_at = 1
       WHERE id = ?1`
    )
    .run(curriculumVersionId)

  sqlite
    .query<void, [string, string]>(
      `UPDATE courses
       SET published_curriculum_version_id = ?1
       WHERE id = ?2`
    )
    .run(curriculumVersionId, courseId)

  return { courseId, curriculumVersionId, lessonId, stepId, unitId }
}

function insertLesson(
  sqlite: WritingAppSqlite,
  lesson: Readonly<{
    curriculumVersionId: string
    lessonId: string
    lessonTitle: string
    sortOrder: number
    stepId: string
    stepType: string
    unitId: string
  }>
): void {
  sqlite
    .query<void, [string, string, string, string, number]>(
      `INSERT INTO lesson_versions (
        curriculum_version_id, id, unit_id, title, description, category,
        summary_json, estimated_minutes, status, sort_order
      ) VALUES (?1, ?2, ?3, ?4, NULL, NULL, '[]', 5, 'active', ?5)`
    )
    .run(
      lesson.curriculumVersionId,
      lesson.lessonId,
      lesson.unitId,
      lesson.lessonTitle,
      lesson.sortOrder
    )

  sqlite
    .query<void, [string, string, string, string]>(
      `INSERT INTO lesson_step_versions (
        curriculum_version_id, id, lesson_id, type, content_json, status,
        sort_order
      ) VALUES (?1, ?2, ?3, ?4, '{}', 'active', 1)`
    )
    .run(
      lesson.curriculumVersionId,
      lesson.stepId,
      lesson.lessonId,
      lesson.stepType
    )
}
