import { integer, sqliteView, text } from "drizzle-orm/sqlite-core"

/**
 * operations 리포팅에 공개하는 읽기 계약. 뷰 생성은 API migration이 소유하고
 * 이 선언이 이름과 컬럼을 고정한다. 컬럼이 사라지면 migration이 실패한다.
 */
export const learningReportingLessonProgress = sqliteView(
  "learning_reporting_lesson_progress",
  {
    completedAt: integer("completed_at"),
    courseId: text("course_id").notNull(),
    curriculumVersionId: text("curriculum_version_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    startedAt: integer("started_at").notNull(),
    status: text("status").notNull(),
    userId: text("user_id").notNull(),
  }
).existing()

export const learningReportingActivityDays = sqliteView(
  "learning_reporting_activity_days",
  {
    activityDate: text("activity_date").notNull(),
    userId: text("user_id").notNull(),
  }
).existing()
