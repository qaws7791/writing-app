import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

export type PublishedCourseFixture = Readonly<{
  courseId: string
  curriculumVersionId: string
  lessonId: string
  stepId: string
  unitId: string
}>

export type PublishedCourseOptions = Readonly<{
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

  sqlite.exec(`
    INSERT INTO courses (
      id, status, sort_order, published_curriculum_version_id, created_at
    ) VALUES ('${courseId}', 'active', 1, NULL, 1);
    INSERT INTO course_curriculum_versions (
      id, course_id, revision, edit_version, status, title, description,
      category, visual_key, created_at, updated_at, published_at
    ) VALUES (
      '${curriculumVersionId}', '${courseId}', 1, 0, 'draft', '코스', '설명',
      '기초', 'basic-sentence-writing', 1, 1, NULL
    );
    INSERT INTO course_unit_versions (
      curriculum_version_id, id, title, status, sort_order
    ) VALUES ('${curriculumVersionId}', '${unitId}', '단원', 'active', 1);
    INSERT INTO lesson_versions (
      curriculum_version_id, id, unit_id, title, description, category,
      summary_json, estimated_minutes, status, sort_order
    ) VALUES (
      '${curriculumVersionId}', '${lessonId}', '${unitId}', '${lessonTitle}', NULL, NULL,
      '[]', 5, 'active', 1
    );
    INSERT INTO lesson_step_versions (
      curriculum_version_id, id, lesson_id, type, content_json, status,
      sort_order
    ) VALUES (
      '${curriculumVersionId}', '${stepId}', '${lessonId}', '${stepType}', '{}', 'active', 1
    );
    UPDATE course_curriculum_versions
    SET status = 'published', published_at = 1
    WHERE id = '${curriculumVersionId}';
    UPDATE courses
    SET published_curriculum_version_id = '${curriculumVersionId}'
    WHERE id = '${courseId}';
  `)

  return { courseId, curriculumVersionId, lessonId, stepId, unitId }
}
